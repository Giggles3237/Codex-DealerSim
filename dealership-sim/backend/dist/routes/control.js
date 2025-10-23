import { Router } from 'express';
import { asEngineHandler } from './types';
import { createSeedState } from '../data/seed';
const router = Router();
router.post('/pause', asEngineHandler((req, res) => {
    const paused = Boolean(req.body?.paused);
    const state = req.engine.getState();
    state.paused = paused;
    req.repository.setState(state);
    req.schedule();
    res.json(state);
}));
router.post('/speed', asEngineHandler((req, res) => {
    const speed = [1, 5, 30].includes(req.body?.multiplier) ? req.body.multiplier : 1;
    const state = req.engine.getState();
    state.speed = speed;
    req.repository.setState(state);
    req.schedule();
    res.json(state);
}));
router.post('/reset', asEngineHandler((req, res) => {
    const newState = createSeedState();
    req.repository.setState(newState);
    req.schedule();
    res.json(newState);
}));
export default router;
