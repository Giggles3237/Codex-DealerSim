import { Router } from 'express';
import { EngineRequest } from './types';

const router = Router();

router.get('/state', (req: EngineRequest, res) => {
  res.json(req.engine.getState());
});

router.post('/tick', (req: EngineRequest, res) => {
  const days = typeof req.body?.days === 'number' ? req.body.days : 1;
  // Force tick to allow manual advancement even when paused
  const state = req.engine.tick(Math.max(1, Math.min(30, days)), true);
  res.json(state);
});

export default router;
