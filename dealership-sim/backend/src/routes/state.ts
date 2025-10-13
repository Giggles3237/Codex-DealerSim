import { Router, Response } from 'express';
import { EngineRequest, asEngineHandler } from './types';

const router = Router();

router.get('/state', asEngineHandler((req: EngineRequest, res: Response) => {
  res.json(req.engine.getState());
}));

router.post('/tick', asEngineHandler((req: EngineRequest, res: Response) => {
  // Close out the day - processes daily operations and advances to next day
  const state = req.engine.closeOutDay(true);
  req.schedule();
  res.json(state);
}));

export default router;

