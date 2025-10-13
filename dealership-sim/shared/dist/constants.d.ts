import { Coefficients, ConfigPreset, BusinessLevel } from './types';
export declare const DEFAULT_COEFFICIENTS: Coefficients;
export declare const CONFIG_PRESETS: ConfigPreset[];
export declare const DEFAULT_PRICING_STATE: {
    globalPolicy: "balanced";
    segmentPolicies: {};
    agingDiscounts: {
        days60: number;
        days90: number;
    };
};
export declare const PRICING_POLICY_MULTIPLIERS: {
    aggressive: number;
    balanced: number;
    conservative: number;
    market: number;
};
export declare const BUSINESS_LEVELS: BusinessLevel[];
export declare const GAME_CONSTANTS: {
    seasons: readonly ["winter", "spring", "summer", "fall"];
    segments: readonly ["luxury", "performance", "suv", "sedan", "compact", "ev", "crossover", "convertible"];
};
export declare const OPERATING_EXPENSES: {
    advisorSalaryPerDay: number;
    technicianSalaryPerDay: number;
    salesManagerSalaryPerDay: number;
    salesManagerHireCost: number;
    facilityBaseCost: number;
    facilityPerSlot: number;
    overheadBase: number;
    floorPlanInterestRate: number;
};
