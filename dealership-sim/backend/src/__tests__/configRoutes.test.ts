import express from 'express';
import request from 'supertest';
import { createSeedState } from '../data/seed';
import { GameRepository } from '../core/repository/gameRepository';
import { SimulationEngine } from '../core/engine/loop';
import configRoutes from '../routes/config';

const createApp = () => {
  const app = express();
  app.use(express.json());
  const repository = new GameRepository(createSeedState());
  const engine = new SimulationEngine(repository, { seed: 5 });

  app.use((req, _res, next) => {
    (req as any).engine = engine;
    (req as any).repository = repository;
    (req as any).schedule = () => undefined;
    next();
  });

  app.use('/api', configRoutes);
  return app;
};

describe('Config routes', () => {
  it('rejects invalid coefficient payloads', async () => {
    const app = createApp();
    const response = await request(app).put('/api/config').send({ lead: { basePerDay: 500 } });
    expect(response.status).toBe(400);
  });
});
