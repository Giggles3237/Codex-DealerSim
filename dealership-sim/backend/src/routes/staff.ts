import { Router, Response } from 'express';
import { z } from 'zod';
import { EngineRequest, asEngineHandler } from './types.js';
import { ADVISOR_ARCHETYPES, TECH_ARCHETYPES } from '../core/balance/archetypes.js';
import { OPERATING_EXPENSES } from '@dealership/shared';
import { validateHiring, canAutoAdvance } from '../core/progression/featureFlags.js';
import { saveStateToFile } from '../utils/save.js';

const router = Router();

const hireSchema = z.object({
  role: z.enum(['advisor', 'tech', 'manager']),
  archetype: z.string().optional(),
});

const trainSchema = z.object({
  id: z.string(),
  program: z.string(),
});

router.post('/staff/hire', asEngineHandler((req: EngineRequest, res: Response) => {
  const parsed = hireSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const state = req.engine.getState();
  
  if (parsed.data.role === 'manager') {
    if (state.salesManager) {
      return res.status(400).json({ error: 'You already have a Sales Manager' });
    }
    if (state.cash < OPERATING_EXPENSES.salesManagerHireCost) {
      return res.status(400).json({ error: 'Not enough cash to hire Sales Manager' });
    }
    state.cash = Math.round(state.cash - OPERATING_EXPENSES.salesManagerHireCost);
    state.salesManager = {
      id: `manager-${Date.now()}`,
      name: 'Sales Manager',
      hiredDate: `${state.year}-${String(state.month).padStart(2, '0')}-${String(state.day).padStart(2, '0')}`,
      salary: OPERATING_EXPENSES.salesManagerSalaryPerDay,
    };
    state.notifications.push(`Hired Sales Manager! Auto-advance is now enabled.`);
    req.repository.setState(state);
    
    // Save state to disk for persistence
    if (req.savePath) {
      saveStateToFile(state, req.savePath).catch((error) => console.error('Failed to save state after hiring manager', error));
    }
    
    res.json(state);
    return;
  }
  
  if (parsed.data.role === 'advisor') {
    // Validate hiring limits
    const validation = validateHiring(state, 'advisor');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const archetype = ADVISOR_ARCHETYPES.find((arch) => arch.id === parsed.data.archetype);
    if (!archetype) {
      return res.status(400).json({ error: 'Unknown advisor archetype' });
    }
    state.advisors.push({
      id: `advisor-${Date.now()}`,
      name: `${archetype.name} ${Math.floor(Math.random() * 90)}`,
      archetype: archetype.id,
      skill: {
        close: 55 + Math.random() * 20,
        gross: 55 + Math.random() * 20,
        csi: 50 + Math.random() * 20,
        speed: 50 + Math.random() * 20,
      },
      morale: 68,
      trained: [],
      active: true,
    });
  } else {
    // Validate hiring limits
    const validation = validateHiring(state, 'technician');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const archetype = TECH_ARCHETYPES.find((arch) => arch.id === parsed.data.archetype);
    if (!archetype) {
      return res.status(400).json({ error: 'Unknown technician archetype' });
    }
    state.technicians.push({
      id: `tech-${Date.now()}`,
      name: `${archetype.name} ${Math.floor(Math.random() * 90)}`,
      archetype: archetype.id,
      efficiency: 1 + archetype.modifiers.efficiency,
      comebackRate: 0.08 + archetype.modifiers.comebackRate,
      morale: 64,
      active: true,
    });
  }
  state.notifications.push(`Hired a new ${parsed.data.role} (${parsed.data.archetype}).`);
  req.repository.setState(state);
  
  // Save state to disk for persistence
  if (req.savePath) {
    saveStateToFile(state, req.savePath).catch((error) => console.error('Failed to save state after hiring staff', error));
  }
  
  res.json(state);
}));

router.post('/staff/train', asEngineHandler((req: EngineRequest, res: Response) => {
  const parsed = trainSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const state = req.engine.getState();
  const advisor = state.advisors.find((a) => a.id === parsed.data.id);
  if (advisor) {
    advisor.trained = Array.from(new Set([...advisor.trained, parsed.data.program]));
    advisor.morale = Math.min(100, advisor.morale + 5);
    state.notifications.push(`${advisor.name} completed ${parsed.data.program}.`);
  }
  req.repository.setState(state);
  res.json(state);
}));

export default router;

