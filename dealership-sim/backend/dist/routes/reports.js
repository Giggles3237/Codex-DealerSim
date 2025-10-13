"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("./types");
const router = (0, express_1.Router)();
router.get('/reports/monthly', (0, types_1.asEngineHandler)((req, res) => {
    const month = req.query.month;
    const state = req.engine.getState();
    if (month) {
        const report = state.monthlyReports.find((item) => item.month === month);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        return res.json(report);
    }
    res.json(state.monthlyReports);
}));
router.get('/reports/export', (0, types_1.asEngineHandler)((req, res) => {
    const state = req.engine.getState();
    res.json({ month: `${state.year}-${String(state.month).padStart(2, '0')}`, daily: state.dailyHistory });
}));
exports.default = router;
