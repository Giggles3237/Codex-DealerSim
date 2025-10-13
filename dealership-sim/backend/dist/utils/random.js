"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seededRng = exports.RNG = void 0;
class RNG {
    constructor(seed = Date.now() % 2147483647) {
        if (seed <= 0) {
            seed += 2147483646;
        }
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed;
    }
    nextFloat() {
        return (this.next() - 1) / 2147483646;
    }
    pick(array) {
        const index = Math.floor(this.nextFloat() * array.length);
        return array[Math.min(array.length - 1, Math.max(0, index))];
    }
}
exports.RNG = RNG;
const seededRng = (seed) => new RNG(seed);
exports.seededRng = seededRng;
