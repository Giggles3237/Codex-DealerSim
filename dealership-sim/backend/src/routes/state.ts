import { Router } from 'express';
import { EngineRequest } from './types';

const router = Router();

router.get('/state', (req: EngineRequest, res) => {
  res.json(req.engine.getState());
});

router.post('/tick', (req: EngineRequest, res) => {
  // Close out the day - processes daily operations and advances to next day
  const state = req.engine.closeOutDay(true);
  req.schedule();
  res.json(state);
});

export default router;
