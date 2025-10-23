import { __testing } from '../core/services/sales';
import { createSeedState } from '../data/seed';
const { computeClosingProbability } = __testing;
describe('Sales closing probability', () => {
    it('increases with desirability', () => {
        const state = createSeedState();
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
