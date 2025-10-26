import { Router, Response } from 'express';
import { z } from 'zod';
import { EngineRequest, asEngineHandler } from './types.js';

const router = Router();

const schema = z.object({
  perDay: z.number().min(0).max(25000),
});

router.post('/marketing/spend', asEngineHandler((req: EngineRequest, res: Response) => {
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

export default router;

