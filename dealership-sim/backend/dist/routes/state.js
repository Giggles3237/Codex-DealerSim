import { Router } from 'express';
import { asEngineHandler } from './types';
const router = Router();
router.get('/state', asEngineHandler((req, res) => {
    res.json(req.engine.getState());
}));
router.post('/tick', asEngineHandler((req, res) => {
    // Close out the day - processes daily operations and advances to next day
    const state = req.engine.closeOutDay(true);
    req.schedule();
    res.json(state);
}));
export default router;
