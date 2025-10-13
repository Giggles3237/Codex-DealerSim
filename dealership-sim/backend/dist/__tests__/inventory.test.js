"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inventory_1 = require("../core/services/inventory");
const seed_1 = require("../data/seed");
const random_1 = require("../utils/random");
describe('Inventory restock', () => {
    it('does not restock when cash is insufficient', () => {
        const state = (0, seed_1.createSeedState)();
        const result = (0, inventory_1.autoRestock)(state.inventory, 1000, state.coefficients, new random_1.RNG(1), 5, state.pricing);
        expect(result.newVehicles).toHaveLength(0);
        expect(result.cashSpent).toBe(0);
    });
});
