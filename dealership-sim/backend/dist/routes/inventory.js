import { Router } from 'express';
import { z } from 'zod';
import { asEngineHandler } from './types';
import { acquirePack, applyPricingPolicy } from '../core/services/inventory';
import { RNG } from '../utils/random';
import { validateInventoryPurchase, getMaxInventorySlots } from '../core/progression/featureFlags';
import { saveStateToFile } from '../utils/save';
const router = Router();
const acquireSchema = z.object({
    pack: z.enum(['desirable', 'neutral', 'undesirable']),
    qty: z.number().min(1).max(20),
});
const pricingPolicySchema = z.object({
    globalPolicy: z.enum(['aggressive', 'balanced', 'conservative', 'market']).optional(),
    segment: z.enum(['luxury', 'performance', 'suv', 'sedan', 'compact', 'ev', 'crossover', 'convertible']).optional(),
    policy: z.enum(['aggressive', 'balanced', 'conservative', 'market']).optional(),
});
const vehiclePriceSchema = z.object({
    vehicleId: z.string(),
    adjustment: z.number(), // Dollar amount adjustment (can be negative)
});
const agingDiscountsSchema = z.object({
    days60: z.number().min(0).max(0.5),
    days90: z.number().min(0).max(0.5),
});
router.post('/inventory/acquire', asEngineHandler((req, res) => {
    const parsed = acquireSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    // Auction closes at 4 PM - can't buy inventory after that
    if (state.hour >= 16) {
        return res.status(400).json({ error: 'Auction closed at 4 PM. Try again tomorrow.' });
    }
    // Validate against progression limits
    const validation = validateInventoryPurchase(state, parsed.data.qty);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }
    // Calculate avg cost per unit based on lot size (smaller lot = cheaper vehicles)
    const maxInventorySlots = getMaxInventorySlots(state);
    const avgCostPerUnit = Math.round((15000 + (maxInventorySlots * 150)) / 100) * 100;
    const rng = new RNG();
    const acquisition = acquirePack(parsed.data.pack, parsed.data.qty, rng, state.coefficients, state.pricing, avgCostPerUnit);
    if (acquisition.cost > state.cash) {
        return res.status(400).json({ error: 'Not enough cash to acquire vehicles' });
    }
    // Inventory arrives at noon next business day (status: pending)
    const vehiclesWithPendingStatus = acquisition.vehicles.map(vehicle => ({
        ...vehicle,
        status: 'pending',
        purchasedDay: state.day, // Track when vehicles were purchased
    }));
    state.cash = Math.round(state.cash - acquisition.cost);
    state.inventory = [...state.inventory, ...vehiclesWithPendingStatus];
    state.notifications.push(`Purchased ${acquisition.vehicles.length} ${parsed.data.pack} vehicles at auction for $${acquisition.cost.toLocaleString()}. They'll arrive tomorrow at noon.`);
    req.repository.setState(state);
    // Save state to disk for persistence
    if (req.savePath) {
        saveStateToFile(state, req.savePath).catch((error) => console.error('Failed to save state after inventory purchase', error));
    }
    res.json(state);
}));
router.post('/inventory/pricing-policy', asEngineHandler((req, res) => {
    const parsed = pricingPolicySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    if (parsed.data.globalPolicy) {
        state.pricing.globalPolicy = parsed.data.globalPolicy;
        state.notifications.push(`Global pricing policy set to ${parsed.data.globalPolicy}.`);
    }
    if (parsed.data.segment && parsed.data.policy) {
        state.pricing.segmentPolicies[parsed.data.segment] = parsed.data.policy;
        state.notifications.push(`${parsed.data.segment} pricing policy set to ${parsed.data.policy}.`);
    }
    // Recalculate asking prices for all in-stock vehicles based on new policy
    state.inventory = state.inventory.map((vehicle) => {
        if (vehicle.status === 'inStock' && vehicle.baseAsking) {
            const policy = state.pricing.segmentPolicies[vehicle.segment] ?? state.pricing.globalPolicy;
            const newAsking = Math.round(applyPricingPolicy(vehicle.baseAsking, policy, vehicle.desirability, vehicle.ageDays, state.pricing.agingDiscounts) / 100) * 100;
            return {
                ...vehicle,
                asking: vehicle.manualPriceAdjustment ? newAsking + vehicle.manualPriceAdjustment : newAsking
            };
        }
        return vehicle;
    });
    req.repository.setState(state);
    res.json(state);
}));
router.post('/inventory/adjust-price', asEngineHandler((req, res) => {
    const parsed = vehiclePriceSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    const vehicle = state.inventory.find((v) => v.id === parsed.data.vehicleId);
    if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }
    if (vehicle.status !== 'inStock') {
        return res.status(400).json({ error: 'Can only adjust price for in-stock vehicles' });
    }
    // Store the manual adjustment
    vehicle.manualPriceAdjustment = parsed.data.adjustment;
    // Recalculate asking price with adjustment
    if (vehicle.baseAsking) {
        const policy = state.pricing.segmentPolicies[vehicle.segment] ?? state.pricing.globalPolicy;
        const policyPrice = Math.round(applyPricingPolicy(vehicle.baseAsking, policy, vehicle.desirability, vehicle.ageDays, state.pricing.agingDiscounts) / 100) * 100;
        vehicle.asking = Math.max(vehicle.floor, policyPrice + parsed.data.adjustment);
    }
    req.repository.setState(state);
    res.json(state);
}));
router.post('/inventory/aging-discounts', asEngineHandler((req, res) => {
    const parsed = agingDiscountsSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    state.pricing.agingDiscounts = parsed.data;
    state.notifications.push('Aging discount policy updated.');
    // Recalculate asking prices for aged inventory
    state.inventory = state.inventory.map((vehicle) => {
        if (vehicle.status === 'inStock' && vehicle.baseAsking && vehicle.ageDays >= 60) {
            const policy = state.pricing.segmentPolicies[vehicle.segment] ?? state.pricing.globalPolicy;
            const newAsking = Math.round(applyPricingPolicy(vehicle.baseAsking, policy, vehicle.desirability, vehicle.ageDays, state.pricing.agingDiscounts) / 100) * 100;
            return {
                ...vehicle,
                asking: vehicle.manualPriceAdjustment ? newAsking + vehicle.manualPriceAdjustment : newAsking
            };
        }
        return vehicle;
    });
    req.repository.setState(state);
    res.json(state);
}));
export default router;
