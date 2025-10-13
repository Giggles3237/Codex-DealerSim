"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sales_1 = require("../core/services/sales");
const seed_1 = require("../data/seed");
const { computeClosingProbability } = sales_1.__testing;
describe('Sales closing probability', () => {
    it('increases with desirability', () => {
        const state = (0, seed_1.createSeedState)();
        const advisor = state.advisors[0];
        const customer = {
            id: 'c1',
            type: 'Test',
            priceSensitivity: 0.5,
            paymentFocus: 0.5,
            channel: 'web',
            loyalty: 0.5,
            closeBias: 0,
            grossBias: 0,
            csiBias: 0,
            bevAffinity: 0,
        };
        const lowCar = { ...state.inventory[0], desirability: 30 };
        const highCar = { ...state.inventory[0], desirability: 90 };
        const low = computeClosingProbability(advisor, customer, lowCar, state.economy, state.coefficients);
        const high = computeClosingProbability(advisor, customer, highCar, state.economy, state.coefficients);
        expect(high).toBeGreaterThan(low);
    });
});
