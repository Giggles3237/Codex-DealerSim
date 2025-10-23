export class GameRepository {
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
