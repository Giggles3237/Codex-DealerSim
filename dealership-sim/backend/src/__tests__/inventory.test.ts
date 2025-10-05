import { autoRestock } from '../core/services/inventory';
import { createSeedState } from '../data/seed';
import { RNG } from '../utils/random';

describe('Inventory restock', () => {
  it('does not restock when cash is insufficient', () => {
    const state = createSeedState();
    const result = autoRestock(state.inventory, 1000, state.coefficients, new RNG(1), 5);
    expect(result.newVehicles).toHaveLength(0);
    expect(result.cashSpent).toBe(0);
  });
});
