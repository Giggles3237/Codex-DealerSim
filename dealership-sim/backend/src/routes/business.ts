import { Router } from 'express';
import { EngineRequest } from './types';
import { BUSINESS_LEVELS } from '@dealership/shared';

const router = Router();

router.post('/sales-goal', (req: EngineRequest, res) => {
  const { goal } = req.body;
  
  if (!goal || typeof goal !== 'number' || goal <= 0 || goal > 2000) {
    return res.status(400).json({ error: 'Invalid sales goal. Must be between 1 and 2000.' });
  }
  
  const state = req.engine.getState();
  state.salesGoal = goal;
  
  req.repository.setState(state);
  res.json(state);
});

router.post('/business/upgrade', (req: EngineRequest, res) => {
  const state = req.engine.getState();
  const currentLevel = BUSINESS_LEVELS.find(level => level.level === state.businessLevel);
  const nextLevel = BUSINESS_LEVELS.find(level => level.level === state.businessLevel + 1);
  
  if (!nextLevel) {
    return res.status(400).json({ error: 'No upgrade available' });
  }
  
  // Check if requirements are met
  if (nextLevel.unlockCost && state.cash < nextLevel.unlockCost) {
    return res.status(400).json({ error: 'Not enough cash for upgrade' });
  }
  
  // Check unlock requirements
  if (nextLevel.unlockRequirement) {
    if (nextLevel.unlockRequirement.includes('$50,000 total revenue') && state.totalRevenue < 50000) {
      return res.status(400).json({ error: 'Need $50,000 total revenue' });
    }
    if (nextLevel.unlockRequirement.includes('Sell 100 vehicles') && state.lifetimeSales < 100) {
      return res.status(400).json({ error: 'Need to sell 100 vehicles' });
    }
    if (nextLevel.unlockRequirement.includes('95+ CSI rating') && state.csi < 95) {
      return res.status(400).json({ error: 'Need 95+ CSI rating' });
    }
    if (nextLevel.unlockRequirement.includes('$1M total revenue') && state.totalRevenue < 1000000) {
      return res.status(400).json({ error: 'Need $1M total revenue' });
    }
  }
  
  // Perform upgrade
  state.businessLevel = nextLevel.level;
  if (nextLevel.unlockCost) {
    state.cash = Math.round(state.cash - nextLevel.unlockCost);
  }
  
  // Update marketing budget to new level
  state.marketing.spendPerDay = nextLevel.marketingBudget;
  
  // Add new feature unlock
  const newFeature = `level_${nextLevel.level}`;
  if (!state.unlockedFeatures.includes(newFeature)) {
    state.unlockedFeatures.push(newFeature);
  }
  
  state.notifications.push(`🎉 Business upgraded to ${nextLevel.name}! New capacity unlocked.`);
  
  req.repository.setState(state);
  res.json(state);
});

export default router;
