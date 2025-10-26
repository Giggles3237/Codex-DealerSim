import express from 'express';
import cors from 'cors';
import { GameRepository } from './core/repository/gameRepository.js';
import { SimulationEngine } from './core/engine/loop.js';
import { createSeedState } from './data/seed.js';
import { loadStateFromFile, saveStateToFile } from './utils/save.js';
import stateRoutes from './routes/state.js';
import configRoutes from './routes/config.js';
import controlRoutes from './routes/control.js';
import staffRoutes from './routes/staff.js';
import inventoryRoutes from './routes/inventory.js';
import marketingRoutes from './routes/marketing.js';
import reportsRoutes from './routes/reports.js';
import businessRoutes from './routes/business.js';
import upgradesRoutes from './routes/upgrades.js';

interface StartOptions {
  port: number;
  seedMode?: string;
}

export const startServer = async ({ port, seedMode }: StartOptions) => {
  console.log('=== CREATING EXPRESS APP ===');
  const app = express();
  app.use(cors());
  app.use(express.json());
  console.log('=== EXPRESS MIDDLEWARE CONFIGURED ===');

  const savePath = process.env.SAVE_PATH;
  const shouldReset = seedMode === 'reset';
  console.log(`=== INITIALIZING GAME STATE ===`);
  console.log(`Save path: ${savePath}, Should reset: ${shouldReset}`);
  
  let initialState;
  try {
    initialState = shouldReset ? null : await loadStateFromFile(savePath ?? undefined);
    if (!initialState) {
      console.log('=== CREATING SEED STATE ===');
      initialState = createSeedState();
    }
    console.log('=== GAME STATE INITIALIZED ===');
  } catch (error) {
    console.error('=== ERROR INITIALIZING GAME STATE ===', error);
    console.log('=== FALLING BACK TO SEED STATE ===');
    initialState = createSeedState();
  }
  
  let repository: GameRepository;
  let engine: SimulationEngine;
  try {
    repository = new GameRepository(initialState);
    engine = new SimulationEngine(repository, { seed: 1337 });
    console.log('=== SIMULATION ENGINE CREATED ===');
  } catch (error) {
    console.error('=== ERROR CREATING SIMULATION ENGINE ===', error);
    throw error;
  }

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

  console.log('=== SETTING UP MIDDLEWARE ===');
  app.use((req, res, next) => {
    (req as any).engine = engine;
    (req as any).repository = repository;
    (req as any).schedule = schedule;
    (req as any).savePath = savePath;
    next();
  });

  console.log('=== SETTING UP ROUTES ===');
  app.use('/api', stateRoutes);
  app.use('/api', configRoutes);
  app.use('/api', controlRoutes);
  app.use('/api', staffRoutes);
  app.use('/api', inventoryRoutes);
  app.use('/api', marketingRoutes);
  app.use('/api', reportsRoutes);
  app.use('/api', businessRoutes);
  app.use('/api', upgradesRoutes);
  console.log('=== ROUTES CONFIGURED ===');

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

  console.log('=== SETTING UP HEALTH CHECK ===');
  app.get('/health', (_req, res) => {
    console.log('Health check requested');
    res.json({ status: 'ok' });
  });

  console.log('=== STARTING SERVER ===');
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Backend listening on http://0.0.0.0:${port}`);
    console.log(`✅ Health endpoint available at http://0.0.0.0:${port}/health`);
    console.log('=== SERVER STARTUP COMPLETE ===');
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
};
