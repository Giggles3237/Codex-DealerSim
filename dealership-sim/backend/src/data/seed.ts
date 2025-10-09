import {
  Coefficients,
  DailyReport,
  DEFAULT_COEFFICIENTS,
  DEFAULT_PRICING_STATE,
  GameState,
  MarketingState,
  MonthlyReport,
  PricingState,
  SalesAdvisor,
  Technician,
  Vehicle,
} from '@dealership/shared';
import { ADVISOR_ARCHETYPES, TECH_ARCHETYPES } from '../core/balance/archetypes';
import { RNG } from '../utils/random';
import { createVehicle } from '../core/services/inventory';

const STARTING_CASH = 150_000; // Much smaller starting capital for tycoon feel
const START_YEAR = 2024;
const START_MONTH = 1;
const START_DAY = 1;

const baseMarketing: MarketingState = {
  spendPerDay: 2500,
  leadMultiplier: 1,
};

const createAdvisors = (rng: RNG, maxAdvisors: number = 3): SalesAdvisor[] => {
  return ADVISOR_ARCHETYPES.slice(0, maxAdvisors).map((arch, index) => ({
    id: `advisor-${index + 1}`,
    name: arch.name,
    archetype: arch.id,
    skill: {
      close: 55 + rng.nextFloat() * 30,
      gross: 55 + rng.nextFloat() * 30,
      csi: 50 + rng.nextFloat() * 20,
      speed: 50 + rng.nextFloat() * 20,
    },
    morale: 65 + rng.nextFloat() * 20,
    trained: index % 3 === 0 ? ['delivery-mastery'] : [],
    active: true,
  }));
};

const createTechnicians = (rng: RNG, maxTechnicians: number = 2): Technician[] => {
  return TECH_ARCHETYPES.slice(0, maxTechnicians).map((arch, index) => ({
    id: `tech-${index + 1}`,
    name: arch.name,
    archetype: arch.id,
    efficiency: 1 + arch.modifiers.efficiency,
    comebackRate: 0.08 + arch.modifiers.comebackRate,
    morale: 60 + rng.nextFloat() * 25,
    active: true,
  }));
};

const createInventory = (rng: RNG, coefficients: Coefficients, pricingState: PricingState, maxSlots: number = 15): Vehicle[] => {
  const segments: Vehicle['segment'][] = ['suv', 'sedan', 'crossover', 'compact', 'ev', 'performance', 'luxury', 'convertible'];
  const vehicles: Vehicle[] = [];
  while (vehicles.length < maxSlots) {
    const baseCost = 28000 * (0.9 + rng.nextFloat() * 0.6);
    const segment = rng.pick(segments);
    const condition: Vehicle['condition'] = rng.pick(['new', 'used', 'cpo', 'bev']);
    const vehicle = createVehicle(
      {
        segment,
        condition,
        desirability: 45 + rng.nextFloat() * 45,
        ageDays: Math.floor(rng.nextFloat() * 40),
        make: segment === 'ev' ? 'MIN-E' : 'Bimmer',
        model: segment === 'suv' ? 'X7' : segment === 'performance' ? 'M4' : 'Series',
      },
      rng,
      coefficients,
      baseCost,
      pricingState,
    );
    vehicles.push(vehicle);
  }
  return vehicles;
};

const createHistory = (rng: RNG): { daily: DailyReport[]; monthly: MonthlyReport[] } => {
  const daily: DailyReport[] = [];
  const monthly: MonthlyReport[] = [];
  let cash = STARTING_CASH;
  for (let i = 0; i < 30; i += 1) {
    const units = Math.round(4 + rng.nextFloat() * 4);
    const front = units * (2300 + rng.nextFloat() * 700);
    const back = units * (900 + rng.nextFloat() * 300);
    const total = front + back + 12000;
    cash += front + back;
    daily.push({
      date: `2023-12-${String(i + 1).padStart(2, '0')}`,
      salesUnits: units,
      frontGross: front,
      backGross: back,
      totalGross: total,
      closingRate: 0.4 + rng.nextFloat() * 0.1,
      serviceLaborHours: 90 + rng.nextFloat() * 20,
      servicePartsRevenue: 15000 + rng.nextFloat() * 4000,
      serviceComebackRate: 0.08 + rng.nextFloat() * 0.04,
      cash,
      marketingSpend: baseMarketing.spendPerDay,
      operatingExpenses: 800, // Historical operating expenses estimate
      floorPlanInterest: 50, // Historical floor plan interest estimate
      moraleIndex: 70,
      csi: 82,
    });
  }
  monthly.push({
    month: '2023-12',
    salesUnits: daily.reduce((acc, report) => acc + report.salesUnits, 0),
    frontGross: daily.reduce((acc, report) => acc + report.frontGross, 0),
    backGross: daily.reduce((acc, report) => acc + report.backGross, 0),
    totalGross: daily.reduce((acc, report) => acc + report.totalGross, 0),
    avgFrontGross: 2600,
    avgBackGross: 950,
    closingRate: 0.42,
    inventoryStart: 40,
    inventoryEnd: 38,
    aged60Plus: 4,
    aged90Plus: 1,
    serviceLaborHours: daily.reduce((acc, report) => acc + report.serviceLaborHours, 0),
    servicePartsRevenue: daily.reduce((acc, report) => acc + report.servicePartsRevenue, 0),
    comebackRate: daily.reduce((acc, report) => acc + report.serviceComebackRate, 0) / daily.length,
    cashDelta: 120000,
    advertisingROI: 3.2,
    fixedCoverage: 0.85,
    moraleTrend: 1.2,
    trainingCompletions: 4,
    csi: 82,
    operatingExpenses: daily.reduce((acc, report) => acc + report.operatingExpenses, 0),
    floorPlanInterest: daily.reduce((acc, report) => acc + report.floorPlanInterest, 0),
  });
  return { daily, monthly };
};

export const createSeedState = (seed = 42, coefficients: Coefficients = DEFAULT_COEFFICIENTS): GameState => {
  const rng = new RNG(seed);
  const pricingState: PricingState = { ...DEFAULT_PRICING_STATE };
  
  // Start small - Level 1 business constraints
  const advisors = createAdvisors(rng, 3); // Only 3 advisors
  const technicians = createTechnicians(rng, 2); // Only 2 technicians
  const inventory = createInventory(rng, coefficients, pricingState, 8); // Only 8 vehicles to start
  const history = createHistory(rng);

  const state: GameState = {
    day: START_DAY,
    month: START_MONTH,
    year: START_YEAR,
    speed: 1,
    paused: true, // Start paused since no sales manager
    cash: STARTING_CASH,
    inventory,
    advisors,
    technicians,
    salesManager: null, // Must hire to enable auto-advance
    pipeline: { leads: 15, appointments: 8, deals: 5 }, // Smaller pipeline
    activeDeals: [],
    recentDeals: [],
    serviceQueue: [],
    completedROs: [],
    marketing: { spendPerDay: 500, leadMultiplier: 1 }, // Smaller marketing budget
    pricing: pricingState,
    economy: {
      demandIndex: 1,
      interestRate: 5.2,
      incentiveLevel: 0.3,
      weatherFactor: 0.8,
      season: 'winter',
    },
    coefficients: { ...coefficients },
    csi: 82,
    moraleIndex: 72,
    dailyHistory: history.daily,
    monthlyReports: history.monthly,
    notifications: ['Welcome to your small lot! Hire a Sales Manager to enable auto-advance, or advance each day manually.'],
    businessLevel: 1,
    totalRevenue: 0,
    lifetimeSales: 0,
    unlockedFeatures: ['basic_operations'],
    leadActivity: [],
    salesGoal: 120, // Start with a modest goal of 120 cars per year (10/month)
    autoRestockEnabled: false, // Default to manual inventory management
  };
  return state;
};
