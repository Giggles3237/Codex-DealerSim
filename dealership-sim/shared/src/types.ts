export type VehicleCondition = 'new' | 'used' | 'cpo' | 'bev';
export type VehicleStatus = 'inStock' | 'pending' | 'sold';
export type PricingPolicy = 'aggressive' | 'balanced' | 'conservative' | 'market';

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
  baseAsking?: number; // Original calculated asking price before manual adjustments
  manualPriceAdjustment?: number; // Manual price adjustment in dollars
  ageDays: number;
  desirability: number;
  condition: VehicleCondition;
  reconCost: number;
  holdbackPct: number;
  pack: number;
  status: VehicleStatus;
  purchasedDay?: number; // Day when vehicle was purchased (for delivery tracking)
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

export interface SalesManager {
  id: string;
  name: string;
  hiredDate: string;
  salary: number; // Daily salary
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

export interface PricingState {
  globalPolicy: PricingPolicy;
  segmentPolicies: Partial<Record<Vehicle['segment'], PricingPolicy>>;
  agingDiscounts: {
    days60: number; // Percentage discount at 60 days
    days90: number; // Percentage discount at 90 days
  };
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
  operatingExpenses: number; // Daily operating expenses (salaries, rent, overhead)
  floorPlanInterest: number; // Daily interest on inventory floor plan financing
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
  operatingExpenses: number; // Monthly operating expenses
  floorPlanInterest: number; // Monthly floor plan interest
}

export interface BusinessLevel {
  level: number;
  name: string;
  maxAdvisors: number;
  maxTechnicians: number;
  maxInventorySlots: number;
  serviceBayCount: number;
  marketingBudget: number;
  unlockCost?: number;
  unlockRequirement?: string;
  description: string;
}

export interface LeadActivity {
  id: string;
  timestamp: string;
  advisorId?: string;
  advisorName?: string;
  customerType: string;
  outcome: 'lead' | 'appointment' | 'sale' | 'no_show';
  vehicleId?: string;
  vehicleInfo?: string;
  gross?: number;
}

export interface UpgradeRequirements {
  revenue?: number;
  lifetimeSales?: number;
  csi?: number;
  cash?: number;
  achievements?: string[];
  businessLevel?: number;
  upgrades?: string[]; // Other upgrades that must be purchased first
}

export interface UpgradeEffect {
  maxAdvisors?: number;
  maxTechnicians?: number;
  maxInventorySlots?: number;
  unlockService?: boolean;
  enableAutoAdvance?: boolean;
  enableAutoBuyer?: boolean;
  enableAutoPricer?: boolean;
  enableMarketingOptimizer?: boolean;
  speedMultiplier?: number;
  additionalFeatures?: string[];
}

export type UpgradeCategory = 'staff' | 'facilities' | 'automation' | 'capacity' | 'efficiency';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: UpgradeCategory;
  unlocked: boolean;  // Visible to player
  purchased: boolean;
  requirements: UpgradeRequirements;
  effects: UpgradeEffect;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedDate?: string;
  hidden: boolean; // Don't show until completed
  requirements: {
    type: 'revenue' | 'sales' | 'csi' | 'cash' | 'service_ros' | 'streak';
    value: number;
  };
}

export type NotificationType = 'update' | 'achievement' | 'upgrade';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
}

export interface GameState {
  day: number;
  month: number;
  year: number;
  hour: number; // Current hour (9-21 for 9 AM to 9 PM)
  speed: 1 | 5 | 30;
  paused: boolean;
  cash: number;
  // Daily accumulation (resets each day)
  todayDeals?: Deal[];
  todaySoldVehicles?: Vehicle[];
  todayLeadsGenerated?: number;
  todayAppointments?: number;
  todayDealsWorked?: number;
  todayCashDelta?: number;
  todayCsiDelta?: number;
  todayMoraleDelta?: number;
  todayServiceHours?: number;
  todayServiceParts?: number;
  todayServiceROs?: number;
  inventory: Vehicle[];
  advisors: SalesAdvisor[];
  technicians: Technician[];
  salesManager: SalesManager | null; // Unlocks auto-advance when hired
  autoCloseDayScheduled?: boolean; // Whether auto-close day timer is active
  autoCloseDayTimer?: number; // Timer in milliseconds for auto-close day
  pipeline: PipelineState;
  activeDeals: Deal[];
  recentDeals: Deal[];
  serviceQueue: ServiceQueueItem[];
  completedROs: RepairOrder[];
  marketing: MarketingState;
  pricing: PricingState;
  economy: EconomyState;
  coefficients: Coefficients;
  csi: number;
  moraleIndex: number;
  dailyHistory: DailyReport[];
  monthlyReports: MonthlyReport[];
  notifications: string[]; // Legacy format - kept for backwards compatibility
  storedNotifications: Notification[]; // New structured notifications (persistent)
  businessLevel: number;
  totalRevenue: number;
  lifetimeSales: number;
  unlockedFeatures: string[];
  leadActivity: LeadActivity[];
  salesGoal: number; // Annual sales goal (SPG)
  // Progression system
  availableUpgrades: Upgrade[];
  purchasedUpgrades: string[];
  achievements: Achievement[];
}

export interface HealthCheckResult {
  starving: boolean;
  expectedGross: number;
  replacementGross: number;
  message: string;
}

// Deep partial helper type for nested objects
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  coefficients: DeepPartial<Coefficients>;
}
