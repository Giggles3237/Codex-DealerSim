import { EconomyState, GameState } from '@dealership/shared';
import { RNG } from '../../utils/random.js';

export interface RandomEventResult {
  notifications: string[];
  economy: EconomyState;
}

export const applyRandomEvents = (state: GameState, rng: RNG): RandomEventResult => {
  const notifications: string[] = [];
  const economy = { ...state.economy };

  const roll = rng.nextFloat();
  if (roll < 0.05) {
    economy.incentiveLevel += 0.1;
    economy.demandIndex += 0.08;
    notifications.push('Factory incentive increased! Demand up 8%.');
  } else if (roll < 0.1) {
    economy.weatherFactor -= 0.15;
    notifications.push('Stormy weather hurts showroom traffic.');
  } else if (roll < 0.14) {
    economy.demandIndex += 0.12;
    notifications.push('Corporate fleet deal boosts lead flow!');
  } else if (roll < 0.18) {
    economy.interestRate += 0.2;
    notifications.push('Bank tightens lending. F&I harder this week.');
  }

  economy.demandIndex = Math.max(0.4, Math.min(2, economy.demandIndex));
  economy.weatherFactor = Math.max(0, Math.min(1, economy.weatherFactor));
  economy.incentiveLevel = Math.max(0, Math.min(1.5, economy.incentiveLevel));

  return { notifications, economy };
};
