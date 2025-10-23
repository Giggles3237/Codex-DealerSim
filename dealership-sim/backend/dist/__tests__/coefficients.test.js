import { DEFAULT_COEFFICIENTS } from '@dealership/shared';
import { healthCheck, mergeCoefficients } from '../core/balance/coefficients';
import { createSeedState } from '../data/seed';
describe('Coefficient guardrails', () => {
    it('flags starvation when replacement cost too high', () => {
        const state = createSeedState();
        const hostile = mergeCoefficients(DEFAULT_COEFFICIENTS, {
            finance: { avgBackGross: 100 },
            pricing: { variancePct: 0.12 },
            guardrails: { targetReplacementGross: 6000 },
        });
        const result = healthCheck(state.inventory, hostile);
        expect(result.starving).toBe(true);
    });
});
