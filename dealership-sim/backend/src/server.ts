import express from 'express';
import cors from 'cors';
import { GameRepository } from './core/repository/gameRepository';
import { SimulationEngine } from './core/engine/loop';
import { createSeedState } from './data/seed';
import { loadStateFromFile, saveStateToFile } from './utils/save';
import stateRoutes from './routes/state';
import configRoutes from './routes/config';
import controlRoutes from './routes/control';
import staffRoutes from './routes/staff';
import inventoryRoutes from './routes/inventory';
import marketingRoutes from './routes/marketing';
import reportsRoutes from './routes/reports';
import businessRoutes from './routes/business';
import upgradesRoutes from './routes/upgrades';

interface StartOptions {
  port: number;
  seedMode?: string;
}

export const startServer = async ({ port, seedMode }: StartOptions) => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const savePath = process.env.SAVE_PATH;
  const shouldReset = seedMode === 'reset';
  let initialState = shouldReset ? null : await loadStateFromFile(savePath ?? undefined);
  if (!initialState) {
    initialState = createSeedState();
  }
  const repository = new GameRepository(initialState);
  const engine = new SimulationEngine(repository, { seed: 1337 });

  let interval: NodeJS.Timeout | null = null;
  const baseTickInterval = Number(process.env.TICK_INTERVAL_MS) || 2000; // 2 seconds per hour at 1x speed

  const schedule = () => {
    if (interval) {
      clearInterval(interval);
    }
    const state = engine.getState();
    // Auto-advance hours during the day, pause at 9 PM for manual closeout
    if (!state.paused) {
      // Speeds: 1x = 2s/hour, 5x = 0.4s/hour, 30x = 0.067s/hour
      const tickInterval = Math.max(67, baseTickInterval / state.speed);
      interval = setInterval(() => {
        const updated = engine.tick(1); // Advance 1 hour per tick
        if (savePath) {
          saveStateToFile(updated, savePath).catch((error) => console.error('Failed to save state', error));
        }
      }, tickInterval);
    }
  };

  schedule();

  app.use((req, res, next) => {
    (req as any).engine = engine;
    (req as any).repository = repository;
    (req as any).schedule = schedule;
    (req as any).savePath = savePath;
    next();
  });

  app.use('/api', stateRoutes);
  app.use('/api', configRoutes);
  app.use('/api', controlRoutes);
  app.use('/api', staffRoutes);
  app.use('/api', inventoryRoutes);
  app.use('/api', marketingRoutes);
  app.use('/api', reportsRoutes);
  app.use('/api', businessRoutes);
  app.use('/api', upgradesRoutes);

  app.post('/api/save', async (req, res) => {
    const state = engine.getState();
    try {
      await saveStateToFile(state, savePath ?? undefined);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save game' });
    }
  });

  app.post('/api/load', async (req, res) => {
    try {
      const loaded = await loadStateFromFile(savePath ?? undefined);
      if (!loaded) {
        return res.status(404).json({ error: 'No save game found' });
      }
      repository.setState(loaded);
      res.json(engine.getState());
    } catch (error) {
      res.status(500).json({ error: 'Failed to load game' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
};
