import { runServiceDepartment } from '../core/services/service';
import { createSeedState } from '../data/seed';
import { RNG } from '../utils/random';
describe('Service department', () => {
    it('records comeback penalty impact', () => {
        const state = createSeedState();
        const queue = Array.from({ length: 5 }).map((_, index) => ({
            id: `job-${index}`,
            status: 'waiting',
            laborHours: 3,
            partsRevenue: 0,
            comebackRisk: 0.2,
        }));
        const result = runServiceDepartment(state.technicians, queue, 5, new RNG(3));
        expect(result.completed.length).toBeGreaterThan(0);
        expect(result.csiDelta).toBeLessThanOrEqual(50);
    });
});
