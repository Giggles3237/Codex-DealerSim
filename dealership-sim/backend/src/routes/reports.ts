import { Router, Response } from 'express';
import { EngineRequest, asEngineHandler } from './types.js';

const router = Router();

router.get('/reports/monthly', asEngineHandler((req: EngineRequest, res: Response) => {
  const month = req.query.month as string | undefined;
  const state = req.engine.getState();
  if (month) {
    const report = state.monthlyReports.find((item) => item.month === month);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    return res.json(report);
  }
  res.json(state.monthlyReports);
}));

router.get('/reports/export', asEngineHandler((req: EngineRequest, res: Response) => {
  const state = req.engine.getState();
  res.json({ month: `${state.year}-${String(state.month).padStart(2, '0')}`, daily: state.dailyHistory });
}));

export default router;

