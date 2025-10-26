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
import { ADVISOR_ARCHETYPES, TECH_ARCHETYPES } from '../core/balance/archetypes.js';
import { RNG } from '../utils/random.js';
import { createVehicle } from '../core/services/inventory.js';
import { initializeAchievements } from '../core/progression/unlockManager.js';

const STARTING_CASH = 25_000; // Minimal starting capital for incremental game feel
const START_YEAR = 2024;
const START_MONTH = 1;
const START_DAY = 1;

const baseMarketing: MarketingState = {
  spendPerDay: 2500,
  leadMultiplier: 1,
};

const createAdvisors = (rng: RNG, maxAdvisors: number = 1): SalesAdvisor[] => {
  // Start with just 1 advisor - pick the rookie for authenticity
  const rookie = ADVISOR_ARCHETYPES.find(a => a.id === 'rookie') || ADVISOR_ARCHETYPES[0];
  return [{
    id: 'advisor-1',
    name: rookie.name,
    archetype: rookie.id,
    skill: {
      close: 45 + rng.nextFloat() * 15, // Lower skills for starting advisor
      gross: 45 + rng.nextFloat() * 15,
      csi: 45 + rng.nextFloat() * 15,
      speed: 45 + rng.nextFloat() * 15,
    },
    morale: 55 + rng.nextFloat() * 15,
    trained: [],
    active: true,
  }];
};

const createTechnicians = (rng: RNG, maxTechnicians: number = 0): Technician[] => {
  // Start with NO technicians - service is locked initially
  return [];
};

// Create minimal starter inventory for incremental game feel
const createStarterInventory = (rng: RNG, coefficients: Coefficients, pricingState: PricingState, count: number = 4, maxSlots: number = 15): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  const starterSegments: Vehicle['segment'][] = ['compact', 'sedan']; // Only cheap segments to start
  
  // Calculate avg cost based on lot size (smaller lot = cheaper vehicles)
  const avgCostPerUnit = 15000 + (maxSlots * 150);
  
  for (let i = 0; i < count; i++) {
    const baseCost = avgCostPerUnit * 0.65 * (0.9 + rng.nextFloat() * 0.3); // Cheaper than average for starters
    const segment = rng.pick(starterSegments);
    const vehicle = createVehicle(
      {
        segment,
        condition: 'used', // Only used cars to start
        desirability: 40 + rng.nextFloat() * 20, // 40-60 desirability
        ageDays: Math.floor(rng.nextFloat() * 20), // 0-20 days old
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

const createInventory = (rng: RNG, coefficients: Coefficients, pricingState: PricingState, maxSlots: number = 15): Vehicle[] => {
  const segments: Vehicle['segment'][] = ['suv', 'sedan', 'crossover', 'compact', 'ev', 'performance', 'luxury', 'convertible'];
  const vehicles: Vehicle[] = [];
  
  // Calculate avg cost based on lot size (smaller lot = cheaper vehicles)
  const avgCostPerUnit = 15000 + (maxSlots * 150);
  
  while (vehicles.length < maxSlots) {
    const baseCost = avgCostPerUnit * (0.9 + rng.nextFloat() * 0.6);
    const segment = rng.pick(segments);
    const condition: Vehicle['condition'] = rng.pick(['new', 'used', 'cpo', 'bev']);
    const vehicle = createVehicle(
      {
        segment,
        condition,
        desirability: 45 + rng.nextFloat() * 45,
        ageDays: Math.floor(rng.nextFloat() * 40),
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
  
  // MINIMAL START - Incremental game style
  const advisors = createAdvisors(rng, 1); // Only 1 advisor (rookie)
  const technicians = createTechnicians(rng, 0); // NO technicians (service locked)
  const inventory = createStarterInventory(rng, coefficients, pricingState, 10); // Start with 10 cheap used cars
  const history = createHistory(rng);

  const state: GameState = {
    day: START_DAY,
    month: START_MONTH,
    year: START_YEAR,
    hour: 9, // Start at 9 AM
    speed: 1,
    paused: true, // Start paused for player to read initial state
    cash: STARTING_CASH,
    // Initialize daily accumulators
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
    inventory,
    advisors,
    technicians,
    salesManager: null, // Must hire to enable auto-advance
    pipeline: { leads: 15, appointments: 8, deals: 5 }, // Smaller pipeline
    activeDeals: [],
    recentDeals: [],
    serviceQueue: [],
    completedROs: [],
    marketing: { spendPerDay: 200, leadMultiplier: 1 }, // Very small starting marketing budget
    pricing: pricingState,
    economy: {
      demandIndex: 1,
      interestRate: 5.2,
      incentiveLevel: 0.3,
      weatherFactor: 0.8,
      season: 'winter',
    },
    coefficients: { ...coefficients },
    csi: 75,
    moraleIndex: 60,
    dailyHistory: history.daily,
    monthlyReports: history.monthly,
    notifications: [
      '🚗 Welcome to your tiny used car lot!',
      'You have 1 advisor, 4 cheap cars, and $25,000 cash.',
      'Sell cars to earn money and unlock upgrades.',
      'Every sale counts - watch your cash flow carefully!'
    ],
    storedNotifications: [], // Initialize empty achievement storage
    businessLevel: 1,
    totalRevenue: 0,
    lifetimeSales: 0,
    unlockedFeatures: ['basic_operations'],
    leadActivity: [],
    salesGoal: 120, // Start with a modest goal of 120 cars per year (10/month)
    // Progression system initialization
    availableUpgrades: [], // Will be populated by unlock evaluation
    purchasedUpgrades: [],
    achievements: initializeAchievements(), // Initialize all achievements as uncompleted
  };
  return state;
};
