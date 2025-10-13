"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const types_1 = require("./types");
const archetypes_1 = require("../core/balance/archetypes");
const shared_1 = require("@dealership/shared");
const featureFlags_1 = require("../core/progression/featureFlags");
const router = (0, express_1.Router)();
const hireSchema = zod_1.z.object({
    role: zod_1.z.enum(['advisor', 'tech', 'manager']),
    archetype: zod_1.z.string().optional(),
});
const trainSchema = zod_1.z.object({
    id: zod_1.z.string(),
    program: zod_1.z.string(),
});
router.post('/staff/hire', (0, types_1.asEngineHandler)((req, res) => {
    const parsed = hireSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    if (parsed.data.role === 'manager') {
        if (state.salesManager) {
            return res.status(400).json({ error: 'You already have a Sales Manager' });
        }
        if (state.cash < shared_1.OPERATING_EXPENSES.salesManagerHireCost) {
            return res.status(400).json({ error: 'Not enough cash to hire Sales Manager' });
        }
        state.cash = Math.round(state.cash - shared_1.OPERATING_EXPENSES.salesManagerHireCost);
        state.salesManager = {
            id: `manager-${Date.now()}`,
            name: 'Sales Manager',
            hiredDate: `${state.year}-${String(state.month).padStart(2, '0')}-${String(state.day).padStart(2, '0')}`,
            salary: shared_1.OPERATING_EXPENSES.salesManagerSalaryPerDay,
        };
        state.notifications.push(`Hired Sales Manager! Auto-advance is now enabled.`);
        req.repository.setState(state);
        res.json(state);
        return;
    }
    if (parsed.data.role === 'advisor') {
        // Validate hiring limits
        const validation = (0, featureFlags_1.validateHiring)(state, 'advisor');
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        const archetype = archetypes_1.ADVISOR_ARCHETYPES.find((arch) => arch.id === parsed.data.archetype);
        if (!archetype) {
            return res.status(400).json({ error: 'Unknown advisor archetype' });
        }
        state.advisors.push({
            id: `advisor-${Date.now()}`,
            name: `${archetype.name} ${Math.floor(Math.random() * 90)}`,
            archetype: archetype.id,
            skill: {
                close: 55 + Math.random() * 20,
                gross: 55 + Math.random() * 20,
                csi: 50 + Math.random() * 20,
                speed: 50 + Math.random() * 20,
            },
            morale: 68,
            trained: [],
            active: true,
        });
    }
    else {
        // Validate hiring limits
        const validation = (0, featureFlags_1.validateHiring)(state, 'technician');
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        const archetype = archetypes_1.TECH_ARCHETYPES.find((arch) => arch.id === parsed.data.archetype);
        if (!archetype) {
            return res.status(400).json({ error: 'Unknown technician archetype' });
        }
        state.technicians.push({
            id: `tech-${Date.now()}`,
            name: `${archetype.name} ${Math.floor(Math.random() * 90)}`,
            archetype: archetype.id,
            efficiency: 1 + archetype.modifiers.efficiency,
            comebackRate: 0.08 + archetype.modifiers.comebackRate,
            morale: 64,
            active: true,
        });
    }
    state.notifications.push(`Hired a new ${parsed.data.role} (${parsed.data.archetype}).`);
    req.repository.setState(state);
    res.json(state);
}));
router.post('/staff/train', (0, types_1.asEngineHandler)((req, res) => {
    const parsed = trainSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    const advisor = state.advisors.find((a) => a.id === parsed.data.id);
    if (advisor) {
        advisor.trained = Array.from(new Set([...advisor.trained, parsed.data.program]));
        advisor.morale = Math.min(100, advisor.morale + 5);
        state.notifications.push(`${advisor.name} completed ${parsed.data.program}.`);
    }
    req.repository.setState(state);
    res.json(state);
}));
exports.default = router;
