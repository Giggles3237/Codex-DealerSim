import { Coefficients, DEFAULT_COEFFICIENTS, HealthCheckResult, Vehicle, DeepPartial } from '@dealership/shared';

export const cloneCoefficients = (coefficients: Coefficients): Coefficients => ({
  lead: { ...coefficients.lead },
  sales: { ...coefficients.sales },
  pricing: { ...coefficients.pricing },
  inventory: { ...coefficients.inventory },
  economy: { ...coefficients.economy },
  service: { ...coefficients.service },
  finance: { ...coefficients.finance },
  morale: { ...coefficients.morale },
  guardrails: { ...coefficients.guardrails },
});

export const mergeCoefficients = (base: Coefficients, patch: DeepPartial<Coefficients>): Coefficients => {
  const next = cloneCoefficients(base);
  (Object.keys(patch) as (keyof Coefficients)[]).forEach((key) => {
    const value = patch[key];
    if (value) {
      Object.assign((next as any)[key], value);
    }
  });
  return next;
};

export const calculateExpectedGross = (inventory: Vehicle[], coefficients: Coefficients): number => {
  if (inventory.length === 0) {
    return coefficients.guardrails.targetReplacementGross;
  }
  const avgDesirability = inventory.reduce((acc, vehicle) => acc + vehicle.desirability, 0) / inventory.length;
  const desirabilityFactor = 0.5 + avgDesirability / 200;
  const expectedFront = (coefficients.pricing.holdbackPct * 40000 + 1800) * desirabilityFactor;
  const expectedBack = coefficients.finance.avgBackGross * coefficients.finance.backGrossProb;
  return expectedFront + expectedBack;
};

export const healthCheck = (inventory: Vehicle[], coefficients: Coefficients): HealthCheckResult => {
  const expectedGross = calculateExpectedGross(inventory, coefficients);
  const replacementGross = coefficients.guardrails.targetReplacementGross * (1 + coefficients.inventory.auctionCostSpread / 2);
  const starving = expectedGross < replacementGross;
  return {
    starving,
    expectedGross,
    replacementGross,
    message: starving
      ? 'Current balance may not support replenishing inventory. Consider easing guardrails or boosting demand.'
      : 'Coefficients support sustainable restocking.',
  };
};

export const DEFAULT_SERVER_COEFFICIENTS = cloneCoefficients(DEFAULT_COEFFICIENTS);
