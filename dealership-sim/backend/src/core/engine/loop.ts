import { Coefficients, DailyReport, GameState, MonthlyReport, PipelineState } from '@dealership/shared';
import { GameRepository } from '../repository/gameRepository';
import { RNG } from '../../utils/random';
import { ageInventory, autoRestock } from '../services/inventory';
import { simulateSalesDay } from '../services/sales';
import { runServiceDepartment } from '../services/service';
import { applyRandomEvents } from '../events/randomEvents';
import { healthCheck } from '../balance/coefficients';
import { clamp } from '../../utils/math';

const DAYS_PER_MONTH = 30;

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

  tick(days = 1): GameState {
    let state = this.repository.getState();
    for (let i = 0; i < days; i += 1) {
      state = this.runDay(state);
    }
    this.repository.setState(state);
    return state;
  }

  updateCoefficients(coefficients: Coefficients): void {
    const state = this.repository.getState();
    state.coefficients = coefficients;
    this.repository.setState(state);
  }

  private runDay(state: GameState): GameState {
    if (state.paused) {
      return state;
    }

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

    const cashDelta = sales.cashDelta + serviceGross;
    nextState.cash += cashDelta;

    // auto restock if needed
    const restock = autoRestock(
      nextState.inventory.filter((vehicle) => vehicle.status === 'inStock'),
      nextState.cash,
      nextState.coefficients,
      this.rng,
      trailingSales,
    );
    if (restock.cashSpent > 0 && restock.newVehicles.length > 0) {
      nextState.cash -= restock.cashSpent;
      nextState.inventory = nextState.inventory.concat(restock.newVehicles);
      nextState.notifications.push(`Auto-acquired ${restock.newVehicles.length} vehicles to maintain days supply.`);
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

    // reporting
    const dailyReport: DailyReport = {
      date: new Date().toISOString().split('T')[0],
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
      };
      nextState.monthlyReports = [monthly, ...nextState.monthlyReports.filter((report) => report.month !== monthKey)];
    }

    const guardrail = healthCheck(nextState.inventory, nextState.coefficients);
    if (guardrail.starving) {
      nextState.notifications.push(guardrail.message);
    }

    return nextState;
  }
}
