"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../core/services/service");
const seed_1 = require("../data/seed");
const random_1 = require("../utils/random");
describe('Service department', () => {
    it('records comeback penalty impact', () => {
        const state = (0, seed_1.createSeedState)();
        const queue = Array.from({ length: 5 }).map((_, index) => ({
            id: `job-${index}`,
            status: 'waiting',
            laborHours: 3,
            partsRevenue: 0,
            comebackRisk: 0.2,
        }));
        const result = (0, service_1.runServiceDepartment)(state.technicians, queue, 5, new random_1.RNG(3));
        expect(result.completed.length).toBeGreaterThan(0);
        expect(result.csiDelta).toBeLessThanOrEqual(50);
    });
});
