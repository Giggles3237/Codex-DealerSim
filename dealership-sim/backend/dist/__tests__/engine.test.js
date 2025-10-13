"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameRepository_1 = require("../core/repository/gameRepository");
const loop_1 = require("../core/engine/loop");
const seed_1 = require("../data/seed");
describe('SimulationEngine', () => {
    it('produces deterministic results with fixed seed', () => {
        const seedStateA = (0, seed_1.createSeedState)(99);
        const seedStateB = (0, seed_1.createSeedState)(99);
        const repoA = new gameRepository_1.GameRepository(seedStateA);
        const repoB = new gameRepository_1.GameRepository(seedStateB);
        const engineA = new loop_1.SimulationEngine(repoA, { seed: 123 });
        const engineB = new loop_1.SimulationEngine(repoB, { seed: 123 });
        const resultA = engineA.tick(5);
        const resultB = engineB.tick(5);
        expect(resultA.cash).toBeCloseTo(resultB.cash);
        expect(resultA.inventory.length).toEqual(resultB.inventory.length);
        expect(resultA.recentDeals.length).toEqual(resultB.recentDeals.length);
    });
});
