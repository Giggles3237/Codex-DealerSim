import { promises as fs } from 'fs';
import path from 'path';
import { GameState } from '@dealership/shared';

const DEFAULT_SAVE_PATH = path.resolve(__dirname, '../../data/save.json');

export const loadStateFromFile = async (customPath?: string): Promise<GameState | null> => {
  const filePath = customPath ? path.resolve(customPath) : DEFAULT_SAVE_PATH;
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as GameState;
  } catch (error) {
    return null;
  }
};

export const saveStateToFile = async (state: GameState, customPath?: string): Promise<void> => {
  const filePath = customPath ? path.resolve(customPath) : DEFAULT_SAVE_PATH;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
};
