import { Router } from 'express';
import { z } from 'zod';
import { EngineRequest } from './types';
import { acquirePack } from '../core/services/inventory';
import { RNG } from '../utils/random';

const router = Router();

const schema = z.object({
  pack: z.enum(['desirable', 'neutral', 'undesirable']),
  qty: z.number().min(1).max(20),
});

router.post('/inventory/acquire', (req: EngineRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const state = req.engine.getState();
  const rng = new RNG();
  const acquisition = acquirePack(parsed.data.pack, parsed.data.qty, rng, state.coefficients);
  if (acquisition.cost > state.cash) {
    return res.status(400).json({ error: 'Not enough cash to acquire vehicles' });
  }
  state.cash -= acquisition.cost;
  state.inventory = [...state.inventory, ...acquisition.vehicles];
  state.notifications.push(`Acquired ${acquisition.vehicles.length} ${parsed.data.pack} vehicles.`);
  req.repository.setState(state);
  res.json(state);
});

export default router;
