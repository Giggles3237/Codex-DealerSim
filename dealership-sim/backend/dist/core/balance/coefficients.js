"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SERVER_COEFFICIENTS = exports.healthCheck = exports.calculateExpectedGross = exports.mergeCoefficients = exports.cloneCoefficients = void 0;
const shared_1 = require("@dealership/shared");
const cloneCoefficients = (coefficients) => ({
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
exports.cloneCoefficients = cloneCoefficients;
const mergeCoefficients = (base, patch) => {
    const next = (0, exports.cloneCoefficients)(base);
    Object.keys(patch).forEach((key) => {
        const value = patch[key];
        if (value) {
            Object.assign(next[key], value);
        }
    });
    return next;
};
exports.mergeCoefficients = mergeCoefficients;
const calculateExpectedGross = (inventory, coefficients) => {
    if (inventory.length === 0) {
        return coefficients.guardrails.targetReplacementGross;
    }
    const avgDesirability = inventory.reduce((acc, vehicle) => acc + vehicle.desirability, 0) / inventory.length;
    const desirabilityFactor = 0.5 + avgDesirability / 200;
    const expectedFront = (coefficients.pricing.holdbackPct * 40000 + 1800) * desirabilityFactor;
    const expectedBack = coefficients.finance.avgBackGross * coefficients.finance.backGrossProb;
    return expectedFront + expectedBack;
};
exports.calculateExpectedGross = calculateExpectedGross;
const healthCheck = (inventory, coefficients) => {
    const expectedGross = (0, exports.calculateExpectedGross)(inventory, coefficients);
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
exports.healthCheck = healthCheck;
exports.DEFAULT_SERVER_COEFFICIENTS = (0, exports.cloneCoefficients)(shared_1.DEFAULT_COEFFICIENTS);
