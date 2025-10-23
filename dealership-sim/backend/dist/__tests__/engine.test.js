import { GameRepository } from '../core/repository/gameRepository';
import { SimulationEngine } from '../core/engine/loop';
import { createSeedState } from '../data/seed';
describe('SimulationEngine', () => {
    it('produces deterministic results with fixed seed', () => {
        const seedStateA = createSeedState(99);
        const seedStateB = createSeedState(99);
        const repoA = new GameRepository(seedStateA);
        const repoB = new GameRepository(seedStateB);
        const engineA = new SimulationEngine(repoA, { seed: 123 });
        const engineB = new SimulationEngine(repoB, { seed: 123 });
        const resultA = engineA.tick(5);
        const resultB = engineB.tick(5);
        expect(resultA.cash).toBeCloseTo(resultB.cash);
        expect(resultA.inventory.length).toEqual(resultB.inventory.length);
        expect(resultA.recentDeals.length).toEqual(resultB.recentDeals.length);
    });
});
