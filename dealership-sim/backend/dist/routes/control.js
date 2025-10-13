"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("./types");
const seed_1 = require("../data/seed");
const router = (0, express_1.Router)();
router.post('/pause', (0, types_1.asEngineHandler)((req, res) => {
    const paused = Boolean(req.body?.paused);
    const state = req.engine.getState();
    state.paused = paused;
    req.repository.setState(state);
    req.schedule();
    res.json(state);
}));
router.post('/speed', (0, types_1.asEngineHandler)((req, res) => {
    const speed = [1, 5, 30].includes(req.body?.multiplier) ? req.body.multiplier : 1;
    const state = req.engine.getState();
    state.speed = speed;
    req.repository.setState(state);
    req.schedule();
    res.json(state);
}));
router.post('/reset', (0, types_1.asEngineHandler)((req, res) => {
    const newState = (0, seed_1.createSeedState)();
    req.repository.setState(newState);
    req.schedule();
    res.json(newState);
}));
exports.default = router;
