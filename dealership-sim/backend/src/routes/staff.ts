import { Router } from 'express';
import { z } from 'zod';
import { EngineRequest } from './types';
import { ADVISOR_ARCHETYPES, TECH_ARCHETYPES } from '../core/balance/archetypes';

const router = Router();

const hireSchema = z.object({
  role: z.enum(['advisor', 'tech']),
  archetype: z.string(),
});

const trainSchema = z.object({
  id: z.string(),
  program: z.string(),
});

router.post('/staff/hire', (req: EngineRequest, res) => {
  const parsed = hireSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const state = req.engine.getState();
  if (parsed.data.role === 'advisor') {
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
  res.json(state);
});

router.post('/staff/train', (req: EngineRequest, res) => {
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
});

export default router;
