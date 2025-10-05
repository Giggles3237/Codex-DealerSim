import { GameState } from '@dealership/shared';

export class GameRepository {
  private state: GameState;

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  getState(): GameState {
    return this.state;
  }

  setState(state: GameState): void {
    this.state = state;
  }

  updateState(mutator: (state: GameState) => GameState): GameState {
    this.state = mutator(this.state);
    return this.state;
  }
}
