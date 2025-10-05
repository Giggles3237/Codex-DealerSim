export type VehicleCondition = 'new' | 'used' | 'cpo' | 'bev';
export type VehicleStatus = 'inStock' | 'pending' | 'sold';

export interface Vehicle {
  id: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  segment: 'luxury' | 'performance' | 'suv' | 'sedan' | 'compact' | 'ev' | 'crossover' | 'convertible';
  cost: number;
  floor: number;
  asking: number;
  ageDays: number;
  desirability: number;
  condition: VehicleCondition;
  reconCost: number;
  holdbackPct: number;
  pack: number;
  status: VehicleStatus;
}

export interface SkillProfile {
  close: number;
  gross: number;
  csi: number;
  speed: number;
}

export interface SalesAdvisor {
  id: string;
  name: string;
  archetype: string;
  skill: SkillProfile;
  morale: number;
  trained: string[];
  active: boolean;
}

export interface Technician {
  id: string;
  name: string;
  archetype: string;
  efficiency: number;
  comebackRate: number;
  morale: number;
  active: boolean;
}

export interface Customer {
  id: string;
  type: string;
  priceSensitivity: number;
  paymentFocus: number;
  channel: 'walk-in' | 'web' | 'phone' | 'referral';
  loyalty: number;
  closeBias: number;
  grossBias: number;
  csiBias: number;
  bevAffinity: number;
}

export interface Deal {
  id: string;
  vehicleId: string;
  advisorId: string;
  customerId: string;
  date: string;
  frontGross: number;
  backGross: number;
  totalGross: number;
  csiImpact: number;
  soldPrice: number;
}

export interface RepairOrder {
  id: string;
  techId: string;
  date: string;
  laborHours: number;
  partsRevenue: number;
  comeback: boolean;
  csiImpact: number;
}

export interface EconomyState {
  demandIndex: number;
  interestRate: number;
  incentiveLevel: number;
  weatherFactor: number;
  season: 'winter' | 'spring' | 'summer' | 'fall';
}

export interface MarketingState {
  spendPerDay: number;
  leadMultiplier: number;
}

export interface PipelineState {
  leads: number;
  appointments: number;
  deals: number;
}

export interface ServiceQueueItem {
  id: string;
  techId?: string;
  status: 'waiting' | 'inProgress' | 'complete';
  laborHours: number;
  partsRevenue: number;
  comebackRisk: number;
  completedOn?: string;
}

export interface Coefficients {
  lead: {
    basePerDay: number;
    marketingK: number;
    diminishingK: number;
  };
  sales: {
    baseClose: number;
    desirabilityWeight: number;
    priceGapWeight: number;
    archetypeWeight: number;
    economyWeight: number;
  };
  pricing: {
    variancePct: number;
    holdbackPct: number;
    pack: number;
    reconMean: number;
  };
  inventory: {
    minDaysSupply: number;
    bulkBuyUnits: number;
    auctionCostSpread: number;
  };
  economy: {
    volatility: number;
    incentiveImpact: number;
    interestRateBand: number;
  };
  service: {
    baseDemand: number;
    partsToLaborRatio: number;
    comebackPenalty: number;
  };
  finance: {
    avgBackGross: number;
    backGrossProb: number;
    cashLagDays: number;
  };
  morale: {
    trainingEffect: number;
    lowMoralePenalty: number;
  };
  guardrails: {
    targetReplacementGross: number;
  };
}

export interface DailyReport {
  date: string;
  salesUnits: number;
  frontGross: number;
  backGross: number;
  totalGross: number;
  closingRate: number;
  serviceLaborHours: number;
  servicePartsRevenue: number;
  serviceComebackRate: number;
  cash: number;
  marketingSpend: number;
  moraleIndex: number;
  csi: number;
}

export interface MonthlyReport {
  month: string;
  salesUnits: number;
  frontGross: number;
  backGross: number;
  totalGross: number;
  avgFrontGross: number;
  avgBackGross: number;
  closingRate: number;
  inventoryStart: number;
  inventoryEnd: number;
  aged60Plus: number;
  aged90Plus: number;
  serviceLaborHours: number;
  servicePartsRevenue: number;
  comebackRate: number;
  cashDelta: number;
  advertisingROI: number;
  fixedCoverage: number;
  moraleTrend: number;
  trainingCompletions: number;
  csi: number;
}

export interface GameState {
  day: number;
  month: number;
  year: number;
  speed: 1 | 5 | 30;
  paused: boolean;
  cash: number;
  inventory: Vehicle[];
  advisors: SalesAdvisor[];
  technicians: Technician[];
  pipeline: PipelineState;
  activeDeals: Deal[];
  recentDeals: Deal[];
  serviceQueue: ServiceQueueItem[];
  completedROs: RepairOrder[];
  marketing: MarketingState;
  economy: EconomyState;
  coefficients: Coefficients;
  csi: number;
  moraleIndex: number;
  dailyHistory: DailyReport[];
  monthlyReports: MonthlyReport[];
  notifications: string[];
}

export interface HealthCheckResult {
  starving: boolean;
  expectedGross: number;
  replacementGross: number;
  message: string;
}

export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  coefficients: Partial<Coefficients>;
}
