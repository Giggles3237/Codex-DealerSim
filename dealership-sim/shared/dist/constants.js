export const DEFAULT_COEFFICIENTS = {
    lead: {
        basePerDay: 10,
        marketingK: 0.10,
        diminishingK: 0.35,
    },
    sales: {
        baseClose: 0.10,
        desirabilityWeight: 0.6,
        priceGapWeight: -0.4,
        archetypeWeight: 0.4,
        economyWeight: 0.3,
    },
    pricing: {
        variancePct: 0.035,
        holdbackPct: 0.02,
        pack: 450,
        reconMean: 600,
    },
    inventory: {
        minDaysSupply: 35,
        bulkBuyUnits: 8,
        auctionCostSpread: 0.08,
    },
    economy: {
        volatility: 0.15,
        incentiveImpact: 0.1,
        interestRateBand: 0.03,
    },
    service: {
        baseDemand: 55,
        partsToLaborRatio: 0.8,
        comebackPenalty: 6,
    },
    finance: {
        avgBackGross: 950,
        backGrossProb: 0.62,
        cashLagDays: 2,
    },
    morale: {
        trainingEffect: 6,
        lowMoralePenalty: 0.08,
    },
    guardrails: {
        targetReplacementGross: 3200,
    },
};
export const CONFIG_PRESETS = [
    {
        id: 'easy',
        name: 'Easy',
        description: 'Plenty of demand and forgiving margins.',
        coefficients: {
            lead: { basePerDay: 36, marketingK: 0.55 },
            sales: { baseClose: 0.08 },
            pricing: { variancePct: 0.02 },
            inventory: { minDaysSupply: 28 },
            finance: { avgBackGross: 1100, backGrossProb: 0.7 },
        },
    },
    {
        id: 'balanced',
        name: 'Balanced',
        description: 'Default tuning used for internal balancing.',
        coefficients: {},
    },
    {
        id: 'hard',
        name: 'Hard',
        description: 'Tighter margins and colder demand.',
        coefficients: {
            lead: { basePerDay: 20, marketingK: 0.35 },
            sales: { baseClose: 0.03 },
            pricing: { variancePct: 0.05 },
            inventory: { minDaysSupply: 45 },
            finance: { avgBackGross: 800, backGrossProb: 0.5 },
        },
    },
    {
        id: 'wild',
        name: 'Wild',
        description: 'High volatility for testing edge cases.',
        coefficients: {
            economy: { volatility: 0.3, incentiveImpact: 0.18 },
            pricing: { variancePct: 0.07 },
        },
    },
    {
        id: 'ultra-slow',
        name: 'Ultra Slow',
        description: 'Very slow sales - inventory lasts much longer.',
        coefficients: {
            sales: { baseClose: 0.01 },
            lead: { basePerDay: 15, marketingK: 0.25 },
            pricing: { variancePct: 0.04 },
            inventory: { minDaysSupply: 60 },
            finance: { avgBackGross: 700, backGrossProb: 0.4 },
        },
    },
    {
        id: 'extreme-slow',
        name: 'Extreme Slow',
        description: 'Extremely slow sales - inventory lasts months.',
        coefficients: {
            sales: { baseClose: 0.002, desirabilityWeight: 0.2, archetypeWeight: 0.1, economyWeight: 0.1 },
            lead: { basePerDay: 8, marketingK: 0.15 },
            pricing: { variancePct: 0.06 },
            inventory: { minDaysSupply: 90 },
            finance: { avgBackGross: 500, backGrossProb: 0.3 },
        },
    },
];
export const DEFAULT_PRICING_STATE = {
    globalPolicy: 'balanced',
    segmentPolicies: {},
    agingDiscounts: {
        days60: 0.03, // 3% discount at 60 days
        days90: 0.06, // 6% discount at 90 days
    },
};
export const PRICING_POLICY_MULTIPLIERS = {
    aggressive: 0.95, // Price 5% below calculated asking
    balanced: 1.0, // Use calculated asking price
    conservative: 1.05, // Price 5% above calculated asking
    market: 1.0, // Price based on desirability (dynamic)
};
export const BUSINESS_LEVELS = [
    {
        level: 1,
        name: 'Small Lot',
        maxAdvisors: 3,
        maxTechnicians: 2,
        maxInventorySlots: 15,
        serviceBayCount: 2,
        marketingBudget: 1000,
        description: 'A small independent dealership. Start with basic inventory and minimal staff.',
    },
    {
        level: 2,
        name: 'Growing Dealership',
        maxAdvisors: 5,
        maxTechnicians: 4,
        maxInventorySlots: 30,
        serviceBayCount: 4,
        marketingBudget: 2000,
        unlockCost: 50000,
        unlockRequirement: 'Earn $50,000 total revenue',
        description: 'Expand your lot and hire more staff to handle increased volume.',
    },
    {
        level: 3,
        name: 'Regional Dealer',
        maxAdvisors: 8,
        maxTechnicians: 6,
        maxInventorySlots: 60,
        serviceBayCount: 6,
        marketingBudget: 4000,
        unlockCost: 200000,
        unlockRequirement: 'Sell 100 vehicles',
        description: 'A serious operation with multiple service bays and premium inventory.',
    },
    {
        level: 4,
        name: 'Mega Dealer',
        maxAdvisors: 12,
        maxTechnicians: 10,
        maxInventorySlots: 100,
        serviceBayCount: 10,
        marketingBudget: 8000,
        unlockCost: 500000,
        unlockRequirement: 'Achieve 95+ CSI rating',
        description: 'The big leagues - premium facilities and high-volume operations.',
    },
    {
        level: 5,
        name: 'Automotive Empire',
        maxAdvisors: 20,
        maxTechnicians: 15,
        maxInventorySlots: 200,
        serviceBayCount: 15,
        marketingBudget: 15000,
        unlockCost: 1000000,
        unlockRequirement: 'Earn $1M total revenue',
        description: 'The ultimate dealership empire with unlimited potential.',
    },
];
export const GAME_CONSTANTS = {
    seasons: ['winter', 'spring', 'summer', 'fall'],
    segments: ['luxury', 'performance', 'suv', 'sedan', 'compact', 'ev', 'crossover', 'convertible'],
};
// Operating expense constants (daily rates)
export const OPERATING_EXPENSES = {
    advisorSalaryPerDay: 150, // Daily cost per sales advisor (~$55k/year)
    technicianSalaryPerDay: 180, // Daily cost per technician (~$65k/year)
    salesManagerSalaryPerDay: 300, // Daily cost for sales manager (~$110k/year)
    salesManagerHireCost: 5000, // One-time cost to hire sales manager
    facilityBaseCost: 200, // Base facility cost per day (utilities, insurance, etc.)
    facilityPerSlot: 8, // Additional cost per inventory slot per day
    overheadBase: 100, // Base daily overhead (admin, supplies, etc.)
    floorPlanInterestRate: 0.00022, // Daily interest rate on floor plan financing (~8% APR / 365 days)
};
