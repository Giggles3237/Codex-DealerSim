import { Coefficients, DailyReport, GameState, MonthlyReport, PipelineState, OPERATING_EXPENSES, BUSINESS_LEVELS, Notification } from '@dealership/shared';
import { GameRepository } from '../repository/gameRepository';
import { RNG } from '../../utils/random';
import { ageInventory, acquirePack } from '../services/inventory';
import { simulateSalesHour } from '../services/sales';
import { runServiceDepartment } from '../services/service';
import { applyRandomEvents } from '../events/randomEvents';
import { clamp } from '../../utils/math';
import { runProgressionCheck } from '../progression/unlockManager';
import { getMaxInventorySlots } from '../progression/featureFlags';

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

  tick(hours = 1, forceTick = false): GameState {
    let state = this.repository.getState();
    for (let i = 0; i < hours; i += 1) {
      state = this.runHour(state, forceTick);
    }
    this.repository.setState(state);
    return state;
  }

  // Helper to advance a full day (for manual "Advance 1 Day" button)
  tickDay(forceTick = false): GameState {
    return this.tick(12, forceTick); // 12 hours = 1 business day
  }

  updateCoefficients(coefficients: Coefficients): void {
    const state = this.repository.getState();
    state.coefficients = coefficients;
    this.repository.setState(state);
  }

  private runHour(state: GameState, forceTick = false): GameState {
    // Allow manual advancement even when paused (unless auto-advancing)
    if (state.paused && !forceTick) {
      return state;
    }

    const nextState: GameState = {
      ...state,
      hour: state.hour + 1,
      notifications: [],
      // Initialize daily accumulators if this is the first hour
      todayDeals: state.todayDeals || [],
      todaySoldVehicles: state.todaySoldVehicles || [],
      todayLeadsGenerated: state.todayLeadsGenerated || 0,
      todayAppointments: state.todayAppointments || 0,
      todayDealsWorked: state.todayDealsWorked || 0,
      todayCashDelta: state.todayCashDelta || 0,
      todayCsiDelta: state.todayCsiDelta || 0,
      todayMoraleDelta: state.todayMoraleDelta || 0,
      todayServiceHours: state.todayServiceHours || 0,
      todayServiceParts: state.todayServiceParts || 0,
      todayServiceROs: state.todayServiceROs || 0,
    };

    // Deliver pending inventory at noon (hour 12)
    // Only deliver vehicles that were purchased yesterday or earlier
    if (nextState.hour === 12) {
      let reconCostTotal = 0;
      nextState.inventory = nextState.inventory.map(vehicle => {
        if (vehicle.status === 'pending' && vehicle.purchasedDay && vehicle.purchasedDay < nextState.day) {
          reconCostTotal += vehicle.reconCost;
          return { ...vehicle, status: 'inStock' as const };
        }
        return vehicle;
      });
      
      // Deduct recon costs when vehicles arrive
      if (reconCostTotal > 0) {
        nextState.cash = Math.round(nextState.cash - reconCostTotal);
        nextState.todayCashDelta = (nextState.todayCashDelta || 0) - reconCostTotal;
      }
      
      const pendingDelivered = nextState.inventory.filter(v => v.status === 'inStock' && v.ageDays === 0).length;
      if (pendingDelivered > 0) {
        nextState.notifications.push(`${pendingDelivered} vehicles arrived from auction. Recon cost: $${reconCostTotal.toLocaleString()}`);
      }
    }

    // If we've reached end of business day (9 PM = hour 21), pause and wait for player to close out
    const endOfDay = nextState.hour > 21;
    if (endOfDay) {
      // Don't advance yet, just pause and wait for manual closeout
      nextState.hour = 21; // Keep at 9 PM
      nextState.paused = true; // Pause for manual closeout
      
      // If sales manager is hired, set up auto-close day timer
      if (nextState.salesManager && !nextState.autoCloseDayScheduled) {
        nextState.autoCloseDayScheduled = true;
        nextState.autoCloseDayTimer = 10000; // 10 seconds in milliseconds
        nextState.notifications.push('Sales Manager will automatically close out the day in 10 seconds...');
      }
      
      return nextState;
    }

    // During business hours, process sales and service activity
    const currentInventory = nextState.inventory.filter(v => v.status === 'inStock');
    
    // Run hourly sales
    const sales = simulateSalesHour(
      nextState.advisors,
      currentInventory,
      nextState.marketing,
      nextState.economy,
      nextState.coefficients,
      this.rng,
      nextState.hour
    );

    // Update inventory with sold vehicles
    const soldIds = new Set(sales.soldVehicles.map(v => v.id));
    nextState.inventory = nextState.inventory
      .filter(v => !soldIds.has(v.id))
      .concat(sales.soldVehicles.map(v => ({ ...v, status: 'sold' as const })));

    // Accumulate sales results
    nextState.todayDeals = nextState.todayDeals || [];
    nextState.todaySoldVehicles = nextState.todaySoldVehicles || [];
    nextState.todayDeals.push(...sales.deals);
    nextState.todaySoldVehicles.push(...sales.soldVehicles);
    nextState.todayLeadsGenerated = (nextState.todayLeadsGenerated || 0) + sales.leadsGenerated;
    nextState.todayAppointments = (nextState.todayAppointments || 0) + sales.appointments;
    nextState.todayDealsWorked = (nextState.todayDealsWorked || 0) + sales.dealsWorked;
    nextState.todayCashDelta = (nextState.todayCashDelta || 0) + sales.cashDelta;
    nextState.todayCsiDelta = (nextState.todayCsiDelta || 0) + sales.csiDelta;
    nextState.todayMoraleDelta = (nextState.todayMoraleDelta || 0) + sales.moraleDelta;

    // Auto-buy inventory if used car manager is hired and inventory is low
    if (nextState.purchasedUpgrades.includes('used_car_manager') && nextState.hour === 10) {
      // Check inventory levels at 10 AM (auction is open until 4 PM)
      const currentStock = nextState.inventory.filter(v => v.status === 'inStock').length;
      const maxSlots = getMaxInventorySlots(nextState);
      const inventoryThreshold = Math.max(2, Math.floor(maxSlots * 0.2)); // Keep at least 20% of capacity or 2 vehicles
      
      if (currentStock < inventoryThreshold) {
        // Used Car Manager buys conservatively - only 1-2 vehicles at a time
        const neededVehicles = Math.min(2, Math.max(1, maxSlots - currentStock));
        
        // Calculate cost for auto-buy
        const avgCostPerUnit = Math.round((15000 + (maxSlots * 150)) / 100) * 100;
        const estimatedCost = (avgCostPerUnit + 450) * neededVehicles * 1.2; // Add 20% buffer for randomness
        
        if (estimatedCost <= nextState.cash) {
          // Auto-buy inventory
          const rng = new RNG();
          const acquisition = acquirePack('neutral', neededVehicles, rng, nextState.coefficients, nextState.pricing, avgCostPerUnit);
          
          if (acquisition.cost <= nextState.cash) {
            const vehiclesWithPendingStatus = acquisition.vehicles.map(vehicle => ({
              ...vehicle,
              status: 'pending' as const,
              purchasedDay: nextState.day,
            }));
            
            nextState.cash = Math.round(nextState.cash - acquisition.cost);
            nextState.inventory = [...nextState.inventory, ...vehiclesWithPendingStatus];
            nextState.notifications.push(
              `Used Car Manager conservatively purchased ${acquisition.vehicles.length} vehicle${acquisition.vehicles.length > 1 ? 's' : ''} for $${acquisition.cost.toLocaleString()}. They'll arrive tomorrow at noon.`
            );
          }
        }
      }
    }

    // Update cash immediately
    nextState.cash = Math.round(nextState.cash + sales.cashDelta);

    // Store recent deals and lead activity
    nextState.recentDeals = [...sales.deals, ...nextState.recentDeals].slice(0, 20);
    nextState.leadActivity = [...sales.leadActivity, ...nextState.leadActivity].slice(0, 50);

    // Update pipeline (current hour's activity)
    nextState.pipeline = {
      leads: sales.leadsGenerated,
      appointments: sales.appointments,
      deals: sales.dealsWorked,
    };

    // Run hourly service (distribute daily service demand across 12 hours)
    const soldCount = sales.deals.length;
    const hourlyServiceDemand = Math.round(
      (nextState.coefficients.service.baseDemand * 0.5 +
        soldCount * 0.8 +
        nextState.inventory.length * 0.05) / 12
    );

    const serviceResult = runServiceDepartment(
      nextState.technicians,
      nextState.serviceQueue,
      hourlyServiceDemand,
      this.rng,
    );

    nextState.completedROs = [...serviceResult.completed, ...nextState.completedROs].slice(0, 50);
    nextState.serviceQueue = serviceResult.queue;
    
    // Accumulate service results
    nextState.todayServiceHours = (nextState.todayServiceHours || 0) + serviceResult.laborHours;
    nextState.todayServiceParts = (nextState.todayServiceParts || 0) + serviceResult.partsRevenue;
    nextState.todayServiceROs = (nextState.todayServiceROs || 0) + serviceResult.completed.length;
    
    const hourlyServiceGross = (serviceResult.partsRevenue + serviceResult.laborHours * 150) * 0.4;
    nextState.cash = Math.round(nextState.cash + hourlyServiceGross);
    nextState.todayCashDelta = (nextState.todayCashDelta || 0) + hourlyServiceGross;
    nextState.todayCsiDelta = (nextState.todayCsiDelta || 0) + serviceResult.csiDelta;

    return nextState;
  }

  // Cancel auto-close day timer (when user manually closes day)
  cancelAutoCloseDayTimer(): GameState {
    let state = this.repository.getState();
    
    if (state.autoCloseDayScheduled) {
      state.autoCloseDayScheduled = false;
      state.autoCloseDayTimer = undefined;
      state.notifications.push('Auto-close day cancelled.');
    }
    
    this.repository.setState(state);
    return state;
  }

  // Close out the day - processes all daily operations and advances to next day
  closeOutDay(forceTick = false): GameState {
    let state = this.repository.getState();
    
    // Only allow closeout if we're at end of day
    if (state.hour < 21) {
      return state;
    }

    // Cancel auto-close timer if manually closing
    if (!forceTick && state.autoCloseDayScheduled) {
      state = this.cancelAutoCloseDayTimer();
    }

    state = this.runDailyOperations(state, forceTick);
    this.repository.setState(state);
    return state;
  }

  private runDailyOperations(state: GameState, forceTick = false): GameState {
    const startingCash = state.cash; // Track cash at start of day
    const startingInventory = state.inventory.filter(v => v.status === 'inStock').length;
    
    // Use accumulated daily results
    const soldCount = (state.todayDeals || []).length;
    const deals = state.todayDeals || [];
    const soldVehicles = state.todaySoldVehicles || [];
    const totalServiceHours = state.todayServiceHours || 0;
    const totalServiceParts = state.todayServiceParts || 0;
    const totalServiceROs = state.todayServiceROs || 0;
    
    let nextState: GameState = {
      ...state,
      hour: 9, // Reset to 9 AM
      day: state.day + 1,
      notifications: [],
      // Clear daily accumulators
      todayDeals: [],
      todaySoldVehicles: [],
      todayLeadsGenerated: 0,
      todayAppointments: 0,
      todayDealsWorked: 0,
      todayCashDelta: 0,
      todayCsiDelta: 0,
      todayMoraleDelta: 0,
      todayServiceHours: 0,
      todayServiceParts: 0,
      todayServiceROs: 0,
      // Reset auto-close day timer
      autoCloseDayScheduled: false,
      autoCloseDayTimer: undefined,
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

    // age inventory (happens at end of day)
    const agedInventory = ageInventory(nextState.inventory, nextState.economy.demandIndex);
    nextState.inventory = agedInventory;

    // update advisors morale based on today's performance
    const todayMoraleDelta = state.todayMoraleDelta || 0;
    nextState.advisors = nextState.advisors.map((advisor) => {
      const moraleAdjustment = todayMoraleDelta / Math.max(nextState.advisors.length, 1);
      const trainingBoost = advisor.trained.length * (state.coefficients.morale.trainingEffect / 100);
      const morale = clamp(advisor.morale + moraleAdjustment * 5 + trainingBoost, 20, 100);
      return { ...advisor, morale };
    });

    const trailingSales = Math.max(1, soldCount);

    // Service already happened throughout the day, calculate totals
    const serviceRevenue = totalServiceParts + totalServiceHours * 150;
    const serviceGross = serviceRevenue * 0.4;

    // update marketing lead multiplier
    const todayLeadsGenerated = state.todayLeadsGenerated || 0;
    nextState.marketing.leadMultiplier = todayLeadsGenerated / Math.max(1, nextState.coefficients.lead.basePerDay);

    // Final pipeline state shows total day's activity
    const pipeline: PipelineState = {
      leads: todayLeadsGenerated,
      appointments: state.todayAppointments || 0,
      deals: state.todayDealsWorked || 0,
    };
    nextState.pipeline = pipeline;

    // Calculate and deduct operating expenses, floor plan interest, and marketing spend (end of day)
    const operatingExpenses = calculateOperatingExpenses(nextState);
    const floorPlanInterest = calculateFloorPlanInterest(nextState);
    const marketingSpend = nextState.marketing.spendPerDay;
    nextState.cash = Math.round(nextState.cash - operatingExpenses - floorPlanInterest - marketingSpend);
    
    // Track revenue and sales for progression
    const dailyRevenue = deals.reduce((acc, deal) => acc + deal.soldPrice, 0) + serviceGross;
    nextState.totalRevenue += dailyRevenue;
    nextState.lifetimeSales += soldVehicles.length;

    // update CSI and morale index based on today's activity
    const todayCsiDelta = state.todayCsiDelta || 0;
    nextState.csi = clamp(nextState.csi + todayCsiDelta / 50, 10, 100);
    nextState.moraleIndex = clamp(
      nextState.advisors.reduce((acc, advisor) => acc + advisor.morale, 0) / Math.max(nextState.advisors.length, 1),
      0,
      100,
    );

    // Deals and lead activity were already added throughout the day

    // reporting
    const gameDate = `${nextState.year}-${String(nextState.month).padStart(2, '0')}-${String(nextState.day).padStart(2, '0')}`;
    const dailyReport: DailyReport = {
      date: gameDate,
      salesUnits: soldCount,
      frontGross: deals.reduce((acc, deal) => acc + deal.frontGross, 0),
      backGross: deals.reduce((acc, deal) => acc + deal.backGross, 0),
      totalGross: deals.reduce((acc, deal) => acc + deal.totalGross, 0) + serviceGross,
      closingRate: pipeline.deals > 0 ? soldCount / pipeline.deals : 0,
      serviceLaborHours: totalServiceHours,
      servicePartsRevenue: totalServiceParts,
      serviceComebackRate: 0, // Can't easily calculate this from accumulated data
      cash: nextState.cash,
      marketingSpend: marketingSpend,
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
        advertisingROI: (state.todayCashDelta || 0) > 0 ? (state.todayCashDelta || 0) / Math.max(nextState.marketing.spendPerDay, 1) : 0,
        fixedCoverage: partsRevenue > 0 ? serviceGross / partsRevenue : 0,
        moraleTrend: nextState.moraleIndex - state.moraleIndex,
        trainingCompletions: nextState.advisors.reduce((acc, advisor) => acc + advisor.trained.length, 0),
        csi: nextState.csi,
        operatingExpenses: monthlyOperatingExpenses,
        floorPlanInterest: monthlyFloorPlanInterest,
      };
      nextState.monthlyReports = [monthly, ...nextState.monthlyReports.filter((report) => report.month !== monthKey)];
    }

    // Removed guardrail notification - no longer needed
    
    // Create daily summary notification (shown first as modal)
    const dailySummary = this.createDailySummary(
      nextState,
      soldCount,
      deals,
      totalServiceHours,
      totalServiceParts,
      totalServiceROs,
      serviceGross,
      operatingExpenses,
      floorPlanInterest,
      startingCash,
      startingInventory
    );
    nextState.notifications.push(dailySummary);

    // Check for progression unlocks and achievements (shown after daily summary)
    const progressionResult = runProgressionCheck(nextState);
    nextState = progressionResult.state;
    nextState.notifications.push(...progressionResult.notifications);
    
    // Store achievement notifications persistently
    if (progressionResult.storedNotifications.length > 0) {
      if (!nextState.storedNotifications) {
        nextState.storedNotifications = [];
      }
      nextState.storedNotifications.push(...progressionResult.storedNotifications);
    }

    // Keep paused after closeout so player can see summary
    nextState.paused = true;

    return nextState;
  }

  private createDailySummary(
    state: GameState,
    soldCount: number,
    deals: any[],
    serviceHours: number,
    serviceParts: number,
    serviceROs: number,
    serviceGross: number,
    opEx: number,
    floorInterest: number,
    startingCash: number,
    startingInventory: number
  ): string {
    const frontGross = deals.reduce((acc: number, deal: any) => acc + deal.frontGross, 0);
    const backGross = deals.reduce((acc: number, deal: any) => acc + deal.backGross, 0);
    const totalGross = frontGross + backGross + serviceGross;
    const salesCash = deals.reduce((acc: number, deal: any) => acc + deal.soldPrice, 0);
    const marketingSpend = state.marketing.spendPerDay;
    const totalRevenue = salesCash + serviceGross;
    const totalExpenses = opEx + floorInterest + marketingSpend;
    
    const netCash = totalRevenue - totalExpenses;
    const netSign = netCash >= 0 ? '+' : '';
    const endingInventory = state.inventory.filter(v => v.status === 'inStock').length;
    const inventoryChange = endingInventory - startingInventory;
    const inventorySign = inventoryChange >= 0 ? '+' : '';
    
    // Show the previous day's summary (the day that just completed)
    const completedDay = state.day === 1 ? 30 : state.day - 1;
    let summary = `📊 Day ${completedDay} Complete!\n\n`;
    
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
    summary += `Labor Hours: ${serviceHours.toFixed(1)} hrs\n`;
    summary += `Parts Revenue: $${Math.round(serviceParts).toLocaleString()}\n`;
    summary += `Service Gross: $${Math.round(serviceGross).toLocaleString()}\n`;
    summary += `ROs Completed: ${serviceROs}\n\n`;
    
    // Cash Flow
    summary += `━━━ 💵 CASH FLOW ━━━\n`;
    summary += `Starting Cash: $${Math.round(startingCash).toLocaleString()}\n`;
    summary += `Revenue: +$${Math.round(totalRevenue).toLocaleString()}\n`;
    summary += `Expenses: -$${Math.round(totalExpenses).toLocaleString()}\n`;
    summary += `  • OpEx: $${Math.round(opEx).toLocaleString()}\n`;
    summary += `  • Floor Interest: $${Math.round(floorInterest).toLocaleString()}\n`;
    summary += `  • Marketing: $${Math.round(marketingSpend).toLocaleString()}\n`;
    summary += `Net Change: ${netSign}$${Math.round(netCash).toLocaleString()}\n`;
    summary += `Ending Cash: $${Math.round(state.cash).toLocaleString()}\n\n`;
    
    // Inventory
    summary += `━━━ 📦 INVENTORY ━━━\n`;
    summary += `Starting: ${startingInventory} units\n`;
    summary += `Sold: -${soldCount}\n`;
    summary += `Ending: ${endingInventory} units (${inventorySign}${inventoryChange})`;
    
    return summary;
  }
}
