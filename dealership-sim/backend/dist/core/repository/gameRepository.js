"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRepository = void 0;
class GameRepository {
    constructor(initialState) {
        this.state = initialState;
    }
    getState() {
        return this.state;
    }
    setState(state) {
        this.state = state;
    }
    updateState(mutator) {
        this.state = mutator(this.state);
        return this.state;
    }
}
exports.GameRepository = GameRepository;
