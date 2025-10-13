"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("./types");
const router = (0, express_1.Router)();
router.get('/state', (0, types_1.asEngineHandler)((req, res) => {
    res.json(req.engine.getState());
}));
router.post('/tick', (0, types_1.asEngineHandler)((req, res) => {
    // Close out the day - processes daily operations and advances to next day
    const state = req.engine.closeOutDay(true);
    req.schedule();
    res.json(state);
}));
exports.default = router;
