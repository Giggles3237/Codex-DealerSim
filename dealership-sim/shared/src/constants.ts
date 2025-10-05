import { Coefficients, ConfigPreset } from './types';

export const DEFAULT_COEFFICIENTS: Coefficients = {
  lead: {
    basePerDay: 28,
    marketingK: 0.45,
    diminishingK: 0.35,
  },
  sales: {
    baseClose: 0.05,
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

export const CONFIG_PRESETS: ConfigPreset[] = [
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
];

export const GAME_CONSTANTS = {
  seasons: ['winter', 'spring', 'summer', 'fall'] as const,
  segments: ['luxury', 'performance', 'suv', 'sedan', 'compact', 'ev', 'crossover', 'convertible'] as const,
};
