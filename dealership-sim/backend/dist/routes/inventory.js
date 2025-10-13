"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const types_1 = require("./types");
const inventory_1 = require("../core/services/inventory");
const random_1 = require("../utils/random");
const featureFlags_1 = require("../core/progression/featureFlags");
const router = (0, express_1.Router)();
const acquireSchema = zod_1.z.object({
    pack: zod_1.z.enum(['desirable', 'neutral', 'undesirable']),
    qty: zod_1.z.number().min(1).max(20),
});
const pricingPolicySchema = zod_1.z.object({
    globalPolicy: zod_1.z.enum(['aggressive', 'balanced', 'conservative', 'market']).optional(),
    segment: zod_1.z.enum(['luxury', 'performance', 'suv', 'sedan', 'compact', 'ev', 'crossover', 'convertible']).optional(),
    policy: zod_1.z.enum(['aggressive', 'balanced', 'conservative', 'market']).optional(),
});
const vehiclePriceSchema = zod_1.z.object({
    vehicleId: zod_1.z.string(),
    adjustment: zod_1.z.number(), // Dollar amount adjustment (can be negative)
});
const agingDiscountsSchema = zod_1.z.object({
    days60: zod_1.z.number().min(0).max(0.5),
    days90: zod_1.z.number().min(0).max(0.5),
});
router.post('/inventory/acquire', (0, types_1.asEngineHandler)((req, res) => {
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
    const validation = (0, featureFlags_1.validateInventoryPurchase)(state, parsed.data.qty);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }
    // Calculate avg cost per unit based on lot size (smaller lot = cheaper vehicles)
    const maxInventorySlots = (0, featureFlags_1.getMaxInventorySlots)(state);
    const avgCostPerUnit = Math.round((15000 + (maxInventorySlots * 150)) / 100) * 100;
    const rng = new random_1.RNG();
    const acquisition = (0, inventory_1.acquirePack)(parsed.data.pack, parsed.data.qty, rng, state.coefficients, state.pricing, avgCostPerUnit);
    if (acquisition.cost > state.cash) {
        return res.status(400).json({ error: 'Not enough cash to acquire vehicles' });
    }
    // Inventory arrives at noon next business day (status: pending)
    const vehiclesWithPendingStatus = acquisition.vehicles.map(vehicle => ({
        ...vehicle,
        status: 'pending'
    }));
    state.cash = Math.round(state.cash - acquisition.cost);
    state.inventory = [...state.inventory, ...vehiclesWithPendingStatus];
    state.notifications.push(`Purchased ${acquisition.vehicles.length} ${parsed.data.pack} vehicles at auction. They'll arrive tomorrow at noon.`);
    req.repository.setState(state);
    res.json(state);
}));
router.post('/inventory/pricing-policy', (0, types_1.asEngineHandler)((req, res) => {
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
            const newAsking = Math.round((0, inventory_1.applyPricingPolicy)(vehicle.baseAsking, policy, vehicle.desirability, vehicle.ageDays, state.pricing.agingDiscounts) / 100) * 100;
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
router.post('/inventory/adjust-price', (0, types_1.asEngineHandler)((req, res) => {
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
        const policyPrice = Math.round((0, inventory_1.applyPricingPolicy)(vehicle.baseAsking, policy, vehicle.desirability, vehicle.ageDays, state.pricing.agingDiscounts) / 100) * 100;
        vehicle.asking = Math.max(vehicle.floor, policyPrice + parsed.data.adjustment);
    }
    req.repository.setState(state);
    res.json(state);
}));
router.post('/inventory/aging-discounts', (0, types_1.asEngineHandler)((req, res) => {
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
            const newAsking = Math.round((0, inventory_1.applyPricingPolicy)(vehicle.baseAsking, policy, vehicle.desirability, vehicle.ageDays, state.pricing.agingDiscounts) / 100) * 100;
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
exports.default = router;
