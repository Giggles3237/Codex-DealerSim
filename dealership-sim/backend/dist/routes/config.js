"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const types_1 = require("./types");
const coefficients_1 = require("../core/balance/coefficients");
const configSchema = zod_1.z.object({
    lead: zod_1.z.object({ basePerDay: zod_1.z.number().min(5).max(80).optional(), marketingK: zod_1.z.number().min(0).max(2).optional(), diminishingK: zod_1.z.number().min(0).max(2).optional() }).partial(),
    sales: zod_1.z.object({ baseClose: zod_1.z.number().min(-1).max(1).optional(), desirabilityWeight: zod_1.z.number().min(-2).max(2).optional(), priceGapWeight: zod_1.z.number().min(-2).max(2).optional(), archetypeWeight: zod_1.z.number().min(-2).max(2).optional(), economyWeight: zod_1.z.number().min(-2).max(2).optional() }).partial(),
    pricing: zod_1.z.object({ variancePct: zod_1.z.number().min(0).max(0.2).optional(), holdbackPct: zod_1.z.number().min(0).max(0.1).optional(), pack: zod_1.z.number().min(0).max(2000).optional(), reconMean: zod_1.z.number().min(0).max(5000).optional() }).partial(),
    inventory: zod_1.z.object({ minDaysSupply: zod_1.z.number().min(10).max(120).optional(), bulkBuyUnits: zod_1.z.number().min(1).max(25).optional(), auctionCostSpread: zod_1.z.number().min(0).max(0.5).optional() }).partial(),
    economy: zod_1.z.object({ volatility: zod_1.z.number().min(0).max(0.5).optional(), incentiveImpact: zod_1.z.number().min(0).max(0.5).optional(), interestRateBand: zod_1.z.number().min(0).max(1).optional() }).partial(),
    service: zod_1.z.object({ baseDemand: zod_1.z.number().min(0).max(150).optional(), partsToLaborRatio: zod_1.z.number().min(0).max(3).optional(), comebackPenalty: zod_1.z.number().min(0).max(20).optional() }).partial(),
    finance: zod_1.z.object({ avgBackGross: zod_1.z.number().min(0).max(5000).optional(), backGrossProb: zod_1.z.number().min(0).max(1).optional(), cashLagDays: zod_1.z.number().min(0).max(10).optional() }).partial(),
    morale: zod_1.z.object({ trainingEffect: zod_1.z.number().min(0).max(20).optional(), lowMoralePenalty: zod_1.z.number().min(0).max(1).optional() }).partial(),
    guardrails: zod_1.z.object({ targetReplacementGross: zod_1.z.number().min(1000).max(8000).optional() }).partial(),
}).partial();
const router = (0, express_1.Router)();
router.get('/config', (0, types_1.asEngineHandler)((req, res) => {
    const state = req.engine.getState();
    const check = (0, coefficients_1.healthCheck)(state.inventory, state.coefficients);
    res.json({ coefficients: state.coefficients, health: check });
}));
router.put('/config', (0, types_1.asEngineHandler)((req, res) => {
    const parsed = configSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const state = req.engine.getState();
    const merged = (0, coefficients_1.mergeCoefficients)(state.coefficients, parsed.data);
    req.engine.updateCoefficients(merged);
    const check = (0, coefficients_1.healthCheck)(state.inventory, merged);
    res.json({ coefficients: merged, health: check });
}));
const salesGoalSchema = zod_1.z.object({
    goal: zod_1.z.number().min(1).max(10000),
});
router.post('/config/sales-goal', (0, types_1.asEngineHandler)((req, res) => {
    const parsed = salesGoalSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    state.salesGoal = parsed.data.goal;
    req.repository.setState(state);
    res.json(state);
}));
exports.default = router;
