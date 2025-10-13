import { Router, Response } from 'express';
import { z } from 'zod';
import { EngineRequest, asEngineHandler } from './types';
import { healthCheck, mergeCoefficients } from '../core/balance/coefficients';

const configSchema = z.object({
  lead: z.object({ basePerDay: z.number().min(5).max(80).optional(), marketingK: z.number().min(0).max(2).optional(), diminishingK: z.number().min(0).max(2).optional() }).partial(),
  sales: z.object({ baseClose: z.number().min(-1).max(1).optional(), desirabilityWeight: z.number().min(-2).max(2).optional(), priceGapWeight: z.number().min(-2).max(2).optional(), archetypeWeight: z.number().min(-2).max(2).optional(), economyWeight: z.number().min(-2).max(2).optional() }).partial(),
  pricing: z.object({ variancePct: z.number().min(0).max(0.2).optional(), holdbackPct: z.number().min(0).max(0.1).optional(), pack: z.number().min(0).max(2000).optional(), reconMean: z.number().min(0).max(5000).optional() }).partial(),
  inventory: z.object({ minDaysSupply: z.number().min(10).max(120).optional(), bulkBuyUnits: z.number().min(1).max(25).optional(), auctionCostSpread: z.number().min(0).max(0.5).optional() }).partial(),
  economy: z.object({ volatility: z.number().min(0).max(0.5).optional(), incentiveImpact: z.number().min(0).max(0.5).optional(), interestRateBand: z.number().min(0).max(1).optional() }).partial(),
  service: z.object({ baseDemand: z.number().min(0).max(150).optional(), partsToLaborRatio: z.number().min(0).max(3).optional(), comebackPenalty: z.number().min(0).max(20).optional() }).partial(),
  finance: z.object({ avgBackGross: z.number().min(0).max(5000).optional(), backGrossProb: z.number().min(0).max(1).optional(), cashLagDays: z.number().min(0).max(10).optional() }).partial(),
  morale: z.object({ trainingEffect: z.number().min(0).max(20).optional(), lowMoralePenalty: z.number().min(0).max(1).optional() }).partial(),
  guardrails: z.object({ targetReplacementGross: z.number().min(1000).max(8000).optional() }).partial(),
}).partial();

const router = Router();

router.get('/config', asEngineHandler((req: EngineRequest, res: Response) => {
  const state = req.engine.getState();
  const check = healthCheck(state.inventory, state.coefficients);
  res.json({ coefficients: state.coefficients, health: check });
}));

router.put('/config', asEngineHandler((req: EngineRequest, res: Response) => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = req.engine.getState();
  const merged = mergeCoefficients(state.coefficients, parsed.data);
  req.engine.updateCoefficients(merged);
  const check = healthCheck(state.inventory, merged);
  res.json({ coefficients: merged, health: check });
}));

const salesGoalSchema = z.object({
  goal: z.number().min(1).max(10000),
});

router.post('/config/sales-goal', asEngineHandler((req: EngineRequest, res: Response) => {
  const parsed = salesGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const state = req.engine.getState();
  state.salesGoal = parsed.data.goal;
  req.repository.setState(state);
  res.json(state);
}));

export default router;
