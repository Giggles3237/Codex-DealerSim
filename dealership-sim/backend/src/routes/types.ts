import { Request, Response, NextFunction, RequestHandler } from 'express';
import { SimulationEngine } from '../core/engine/loop.js';
import { GameRepository } from '../core/repository/gameRepository.js';

export interface EngineRequest extends Request {
  engine: SimulationEngine;
  repository: GameRepository;
  schedule: () => void;
  savePath?: string | null;
}

export const asEngineHandler = (handler: (req: EngineRequest, res: Response) => any): any => {
  return handler as any;
};
