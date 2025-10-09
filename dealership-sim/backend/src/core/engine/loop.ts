import { Coefficients, DailyReport, GameState, MonthlyReport, PipelineState, OPERATING_EXPENSES, BUSINESS_LEVELS } from '@dealership/shared';
import { GameRepository } from '../repository/gameRepository';
import { RNG } from '../../utils/random';
import { ageInventory, autoRestock } from '../services/inventory';
import { simulateSalesDay } from '../services/sales';
import { runServiceDepartment } from '../services/service';
import { applyRandomEvents } from '../events/randomEvents';
import { healthCheck } from '../balance/coefficients';
import { clamp } from '../../utils/math';

const DAYS_PER_MONTH = 30;

/**
 * Calculate daily operating expenses including salaries, facility costs, and overhead
 */
function calculateOperatingExpenses(state: GameState): number {
  const advisorCount = state.advisors.filter(a => a.active).length;
  const technicianCount = state.technicians.filter(t => t.active).length;
  const inventorySlots = state.inventory.filter(v => v.status === 'inStock').length;
  
  const salaries = (advisorCount * OPERATING_EXPENSES.advisorSalaryPerDay) +
                   (technicianCount * OPERATING_EXPENSES.technicianSalaryPerDay) +
                   (state.salesManager ? OPERATING_EXPENSES.salesManagerSalaryPerDay : 0);
  
  const facilityCosts = OPERATING_EXPENSES.facilityBaseCost +
                        (inventorySlots * OPERATING_EXPENSES.facilityPerSlot);
  
  const overhead = OPERATING_EXPENSES.overheadBase;
  
  return salaries + facilityCosts + overhead;
}

/**
 * Calculate daily floor plan interest on all in-stock inventory
 * Floor plan financing is how dealerships finance their inventory - they pay daily interest
 */
function calculateFloorPlanInterest(state: GameState): number {
  const inStockVehicles = state.inventory.filter(v => v.status === 'inStock');
  const totalFloorValue = inStockVehicles.reduce((sum, vehicle) => sum + vehicle.floor, 0);
  return totalFloorValue * OPERATING_EXPENSES.floorPlanInterestRate;
}

export interface EngineOptions {
  seed?: number;
}

export class SimulationEngine {
  private rng: RNG;

  constructor(private repository: GameRepository, private options: EngineOptions = {}) {
    this.rng = new RNG(options.seed);
  }

  getState(): GameState {
    return this.repository.getState();
  }

  tick(days = 1, forceTick = false): GameState {
    let state = this.repository.getState();
    for (let i = 0; i < days; i += 1) {
      state = this.runDay(state, forceTick);
    }
    this.repository.setState(state);
    return state;
  }

  updateCoefficients(coefficients: Coefficients): void {
    const state = this.repository.getState();
    state.coefficients = coefficients;
    this.repository.setState(state);
  }

  private runDay(state: GameState, forceTick = false): GameState {
    // Allow manual advancement even when paused (unless auto-advancing)
    if (state.paused && !forceTick) {
      return state;
    }

    const startingCash = state.cash; // Track starting cash
    const startingInventory = state.inventory.filter(v => v.status === 'inStock').length; // Track starting inventory

    const nextState: GameState = {
      ...state,
      day: state.day + 1,
      notifications: [],
    };

    if (nextState.day > DAYS_PER_MONTH) {
      nextState.day = 1;
      nextState.month += 1;
      if (nextState.month > 12) {
        nextState.month = 1;
        nextState.year += 1;
      }
    }

    // economy drift and random events
    const drift = (this.rng.nextFloat() - 0.5) * state.coefficients.economy.volatility;
    nextState.economy = {
      ...nextState.economy,
      demandIndex: clamp(nextState.economy.demandIndex + drift, 0.4, 2),
      interestRate: clamp(
        nextState.economy.interestRate + (this.rng.nextFloat() - 0.5) * state.coefficients.economy.interestRateBand,
        1.5,
        12,
      ),
      incentiveLevel: clamp(nextState.economy.incentiveLevel * (0.96 + this.rng.nextFloat() * 0.08), 0, 1.5),
    };

    const randomEvent = applyRandomEvents(nextState, this.rng);
    nextState.economy = randomEvent.economy;
    nextState.notifications = [...nextState.notifications, ...randomEvent.notifications];

    // age inventory
    const agedInventory = ageInventory(nextState.inventory, nextState.economy.demandIndex);

    // run sales
    const sales = simulateSalesDay(
      nextState.advisors,
      agedInventory.filter((vehicle) => vehicle.status === 'inStock'),
      nextState.marketing,
      nextState.economy,
      nextState.coefficients,
      this.rng,
    );

    // update inventory statuses
    const soldIds = new Set(sales.soldVehicles.map((vehicle) => vehicle.id));
    nextState.inventory = agedInventory
      .filter((vehicle) => !soldIds.has(vehicle.id))
      .concat(sales.soldVehicles.map((vehicle) => ({ ...vehicle, status: 'sold' as const })));

    // update advisors morale
    nextState.advisors = nextState.advisors.map((advisor) => {
      const moraleAdjustment = sales.moraleDelta / Math.max(nextState.advisors.length, 1);
      const trainingBoost = advisor.trained.length * (state.coefficients.morale.trainingEffect / 100);
      const morale = clamp(advisor.morale + moraleAdjustment * 5 + trainingBoost, 20, 100);
      return { ...advisor, morale };
    });

    const soldCount = sales.deals.length;
    const trailingSales = Math.max(1, soldCount);

    // service demand derived from sold units and base demand
    const serviceDemand = Math.round(
      nextState.coefficients.service.baseDemand * 0.5 +
        soldCount * 0.8 +
        nextState.inventory.length * 0.05,
    );

    const serviceResult = runServiceDepartment(
      nextState.technicians,
      nextState.serviceQueue,
      serviceDemand,
      this.rng,
    );

    nextState.completedROs = [...serviceResult.completed, ...nextState.completedROs].slice(0, 50);
    nextState.serviceQueue = serviceResult.queue;

    const serviceRevenue = serviceResult.partsRevenue + serviceResult.laborHours * 150;
    const serviceGross = serviceRevenue * 0.4;

    // update marketing lead multiplier
    nextState.marketing.leadMultiplier = sales.leadsGenerated / Math.max(1, nextState.coefficients.lead.basePerDay);

    // update pipeline
    const pipeline: PipelineState = {
      leads: sales.leadsGenerated,
      appointments: sales.appointments,
      deals: sales.dealsWorked,
    };
    nextState.pipeline = pipeline;

    // Calculate and deduct operating expenses and floor plan interest
    const operatingExpenses = calculateOperatingExpenses(nextState);
    const floorPlanInterest = calculateFloorPlanInterest(nextState);
    const cashDelta = sales.cashDelta + serviceGross - operatingExpenses - floorPlanInterest;
    nextState.cash = Math.round(nextState.cash + cashDelta);
    
    // Track revenue and sales for progression
    const dailyRevenue = sales.deals.reduce((acc, deal) => acc + deal.soldPrice, 0) + serviceGross;
    nextState.totalRevenue += dailyRevenue;
    nextState.lifetimeSales += sales.soldVehicles.length;

    // auto restock if enabled
    let autoAcquisitionNotice = '';
    let acquiredCount = 0;
    if (nextState.autoRestockEnabled) {
      const restock = autoRestock(
        nextState.inventory.filter((vehicle) => vehicle.status === 'inStock'),
        nextState.cash,
        nextState.coefficients,
        this.rng,
        trailingSales,
        nextState.pricing,
      );
      if (restock.cashSpent > 0 && restock.newVehicles.length > 0) {
        nextState.cash = Math.round(nextState.cash - restock.cashSpent);
        nextState.inventory = nextState.inventory.concat(restock.newVehicles);
        acquiredCount = restock.newVehicles.length;
        autoAcquisitionNotice = `🚗 Auto-acquired ${acquiredCount} vehicles for $${Math.round(restock.cashSpent).toLocaleString()}`;
      }
    }

    // update CSI and morale index
    nextState.csi = clamp(nextState.csi + (sales.csiDelta + serviceResult.csiDelta) / 50, 10, 100);
    nextState.moraleIndex = clamp(
      nextState.advisors.reduce((acc, advisor) => acc + advisor.morale, 0) / Math.max(nextState.advisors.length, 1),
      0,
      100,
    );

    // store deals
    nextState.recentDeals = [...sales.deals, ...nextState.recentDeals].slice(0, 20);
    
    // store lead activity (keep last 50 activities)
    nextState.leadActivity = [...sales.leadActivity, ...nextState.leadActivity].slice(0, 50);

    // reporting
    const gameDate = `${nextState.year}-${String(nextState.month).padStart(2, '0')}-${String(nextState.day).padStart(2, '0')}`;
    const dailyReport: DailyReport = {
      date: gameDate,
      salesUnits: soldCount,
      frontGross: sales.deals.reduce((acc, deal) => acc + deal.frontGross, 0),
      backGross: sales.deals.reduce((acc, deal) => acc + deal.backGross, 0),
      totalGross: sales.deals.reduce((acc, deal) => acc + deal.totalGross, 0) + serviceGross,
      closingRate: pipeline.deals > 0 ? soldCount / pipeline.deals : 0,
      serviceLaborHours: serviceResult.laborHours,
      servicePartsRevenue: serviceResult.partsRevenue,
      serviceComebackRate: serviceResult.comebackRate,
      cash: nextState.cash,
      marketingSpend: nextState.marketing.spendPerDay,
      operatingExpenses: operatingExpenses,
      floorPlanInterest: floorPlanInterest,
      moraleIndex: nextState.moraleIndex,
      csi: nextState.csi,
    };

    nextState.dailyHistory = [...nextState.dailyHistory, dailyReport].slice(-60);

    if (nextState.day === DAYS_PER_MONTH) {
      const monthKey = `${nextState.year}-${String(nextState.month).padStart(2, '0')}`;
      const monthReports = nextState.dailyHistory.filter((report) => report.date.startsWith(monthKey));
      const salesUnits = monthReports.reduce((acc, report) => acc + report.salesUnits, 0);
      const frontGross = monthReports.reduce((acc, report) => acc + report.frontGross, 0);
      const backGross = monthReports.reduce((acc, report) => acc + report.backGross, 0);
      const totalGross = monthReports.reduce((acc, report) => acc + report.totalGross, 0);
      const serviceLabor = monthReports.reduce((acc, report) => acc + report.serviceLaborHours, 0);
      const partsRevenue = monthReports.reduce((acc, report) => acc + report.servicePartsRevenue, 0);
      const comebackRate = monthReports.length
        ? monthReports.reduce((acc, report) => acc + report.serviceComebackRate, 0) / monthReports.length
        : 0;
      const closingRate = monthReports.length
        ? monthReports.reduce((acc, report) => acc + report.closingRate, 0) / monthReports.length
        : 0;

      const monthlyOperatingExpenses = monthReports.reduce((acc, report) => acc + report.operatingExpenses, 0);
      const monthlyFloorPlanInterest = monthReports.reduce((acc, report) => acc + report.floorPlanInterest, 0);
      
      const monthly: MonthlyReport = {
        month: monthKey,
        salesUnits,
        frontGross,
        backGross,
        totalGross,
        avgFrontGross: salesUnits ? frontGross / salesUnits : 0,
        avgBackGross: salesUnits ? backGross / salesUnits : 0,
        closingRate,
        inventoryStart: state.inventory.length,
        inventoryEnd: nextState.inventory.length,
        aged60Plus: nextState.inventory.filter((vehicle) => vehicle.ageDays >= 60).length,
        aged90Plus: nextState.inventory.filter((vehicle) => vehicle.ageDays >= 90).length,
        serviceLaborHours: serviceLabor,
        servicePartsRevenue: partsRevenue,
        comebackRate,
        cashDelta: nextState.cash - state.cash,
        advertisingROI: sales.cashDelta > 0 ? sales.cashDelta / Math.max(nextState.marketing.spendPerDay, 1) : 0,
        fixedCoverage: partsRevenue > 0 ? serviceGross / partsRevenue : 0,
        moraleTrend: nextState.moraleIndex - state.moraleIndex,
        trainingCompletions: nextState.advisors.reduce((acc, advisor) => acc + advisor.trained.length, 0),
        csi: nextState.csi,
        operatingExpenses: monthlyOperatingExpenses,
        floorPlanInterest: monthlyFloorPlanInterest,
      };
      nextState.monthlyReports = [monthly, ...nextState.monthlyReports.filter((report) => report.month !== monthKey)];
    }

    const guardrail = healthCheck(nextState.inventory, nextState.coefficients);
    if (guardrail.starving) {
      nextState.notifications.push(guardrail.message);
    }

    // Create daily summary notification
    const dailySummary = this.createDailySummary(
      nextState,
      soldCount,
      sales,
      serviceResult,
      serviceGross,
      operatingExpenses,
      floorPlanInterest,
      autoAcquisitionNotice,
      startingCash,
      startingInventory,
      acquiredCount
    );
    nextState.notifications.push(dailySummary);

    return nextState;
  }

  private createDailySummary(
    state: GameState,
    soldCount: number,
    sales: any,
    serviceResult: any,
    serviceGross: number,
    opEx: number,
    floorInterest: number,
    autoAcquisition: string,
    startingCash: number,
    startingInventory: number,
    acquiredCount: number
  ): string {
    const frontGross = sales.deals.reduce((acc: number, deal: any) => acc + deal.frontGross, 0);
    const backGross = sales.deals.reduce((acc: number, deal: any) => acc + deal.backGross, 0);
    const totalGross = frontGross + backGross + serviceGross;
    const salesCash = sales.cashDelta;
    const totalRevenue = salesCash + serviceGross;
    const totalExpenses = opEx + floorInterest;
    
    // Calculate auto acquisition cost from the ending cash
    const autoAcquisitionCost = startingCash + totalRevenue - totalExpenses - state.cash;
    
    const netCash = totalRevenue - totalExpenses - autoAcquisitionCost;
    const netSign = netCash >= 0 ? '+' : '';
    const endingInventory = state.inventory.filter(v => v.status === 'inStock').length;
    const inventoryChange = endingInventory - startingInventory;
    const inventorySign = inventoryChange >= 0 ? '+' : '';
    
    // Show the previous day's summary (the day that just completed)
    const completedDay = state.day === 1 ? 30 : state.day - 1;
    let summary = `📊 Day ${completedDay} Summary:\n\n`;
    
    // Sales Performance
    summary += `━━━ 🚗 SALES ━━━\n`;
    summary += `Units Sold: ${soldCount}\n`;
    summary += `Front Gross: $${Math.round(frontGross).toLocaleString()}`;
    if (soldCount > 0) summary += ` ($${Math.round(frontGross / soldCount).toLocaleString()}/unit)`;
    summary += `\n`;
    summary += `Back Gross: $${Math.round(backGross).toLocaleString()}`;
    if (soldCount > 0) summary += ` ($${Math.round(backGross / soldCount).toLocaleString()}/unit)`;
    summary += `\n`;
    summary += `Total Sales Gross: $${Math.round(frontGross + backGross).toLocaleString()}\n\n`;
    
    // Service Performance
    summary += `━━━ 🔧 SERVICE ━━━\n`;
    summary += `Labor Hours: ${serviceResult.laborHours.toFixed(1)} hrs\n`;
    summary += `Parts Revenue: $${Math.round(serviceResult.partsRevenue).toLocaleString()}\n`;
    summary += `Service Gross: $${Math.round(serviceGross).toLocaleString()}\n`;
    summary += `ROs Completed: ${serviceResult.completedCount}\n\n`;
    
    // Cash Flow
    summary += `━━━ 💵 CASH FLOW ━━━\n`;
    summary += `Starting Cash: $${Math.round(startingCash).toLocaleString()}\n`;
    summary += `Revenue: +$${Math.round(totalRevenue).toLocaleString()}\n`;
    summary += `Expenses: -$${Math.round(totalExpenses).toLocaleString()}\n`;
    summary += `  • OpEx: $${Math.round(opEx).toLocaleString()}\n`;
    summary += `  • Floor Interest: $${Math.round(floorInterest).toLocaleString()}\n`;
    
    if (autoAcquisitionCost > 0) {
      summary += `Auto Restock: -$${Math.round(autoAcquisitionCost).toLocaleString()} (${acquiredCount} units)\n`;
    }
    
    summary += `Net Change: ${netSign}$${Math.round(netCash).toLocaleString()}\n`;
    summary += `Ending Cash: $${Math.round(state.cash).toLocaleString()}\n\n`;
    
    // Inventory
    summary += `━━━ 📦 INVENTORY ━━━\n`;
    summary += `Starting: ${startingInventory} units\n`;
    summary += `Acquired: +${acquiredCount} | Sold: -${soldCount}\n`;
    summary += `Ending: ${endingInventory} units (${inventorySign}${inventoryChange})`;
    
    return summary;
  }
}
