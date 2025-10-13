"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@dealership/shared");
const coefficients_1 = require("../core/balance/coefficients");
const seed_1 = require("../data/seed");
describe('Coefficient guardrails', () => {
    it('flags starvation when replacement cost too high', () => {
        const state = (0, seed_1.createSeedState)();
        const hostile = (0, coefficients_1.mergeCoefficients)(shared_1.DEFAULT_COEFFICIENTS, {
            finance: { avgBackGross: 100 },
            pricing: { variancePct: 0.12 },
            guardrails: { targetReplacementGross: 6000 },
        });
        const result = (0, coefficients_1.healthCheck)(state.inventory, hostile);
        expect(result.starving).toBe(true);
    });
});
