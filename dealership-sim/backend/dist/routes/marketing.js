"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const types_1 = require("./types");
const router = (0, express_1.Router)();
const schema = zod_1.z.object({
    perDay: zod_1.z.number().min(0).max(25000),
});
router.post('/marketing/spend', (0, types_1.asEngineHandler)((req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = req.engine.getState();
    state.marketing.spendPerDay = parsed.data.perDay;
    state.notifications.push(`Marketing spend updated to $${parsed.data.perDay.toFixed(0)} per day.`);
    req.repository.setState(state);
    res.json(state);
}));
exports.default = router;
