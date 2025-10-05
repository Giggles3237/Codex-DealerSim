import { Request } from 'express';
import { SimulationEngine } from '../core/engine/loop';
import { GameRepository } from '../core/repository/gameRepository';

declare module 'express-serve-static-core' {
  interface Request {
    engine?: SimulationEngine;
    repository?: GameRepository;
    schedule?: () => void;
    savePath?: string | null;
  }
}

export type EngineRequest = Request & {
  engine: SimulationEngine;
  repository: GameRepository;
  schedule: () => void;
  savePath?: string | null;
};
