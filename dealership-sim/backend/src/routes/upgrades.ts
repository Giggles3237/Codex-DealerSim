import { Router, Response } from 'express';
import { z } from 'zod';
import { EngineRequest, asEngineHandler } from './types';
import { purchaseUpgrade } from '../core/progression/unlockManager';
import { saveStateToFile } from '../utils/save';

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
    
    // Save state to disk for persistence
    if (req.savePath) {
      saveStateToFile(newState, req.savePath).catch((error) => console.error('Failed to save state after purchasing upgrade', error));
    }
    
    res.json(newState);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}));

export default router;






