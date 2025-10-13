import { Router, Response } from 'express';
import { z } from 'zod';
import { EngineRequest, asEngineHandler } from './types';
import { purchaseUpgrade } from '../core/progression/unlockManager';

const router = Router();

const purchaseSchema = z.object({
  upgradeId: z.string(),
});

router.post('/upgrades/purchase', asEngineHandler((req: EngineRequest, res: Response) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  
  const state = req.engine.getState();
  
  try {
    const newState = purchaseUpgrade(state, parsed.data.upgradeId);
    const upgrade = newState.availableUpgrades.find(u => u.id === parsed.data.upgradeId);
    
    newState.notifications.push(`✨ Purchased: ${upgrade?.name}!`);
    newState.notifications.push(upgrade?.description || '');
    
    req.repository.setState(newState);
    res.json(newState);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}));

export default router;






