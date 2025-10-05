export class RNG {
  private seed: number;

  constructor(seed: number = Date.now() % 2147483647) {
    if (seed <= 0) {
      seed += 2147483646;
    }
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed;
  }

  nextFloat(): number {
    return (this.next() - 1) / 2147483646;
  }

  pick<T>(array: T[]): T {
    const index = Math.floor(this.nextFloat() * array.length);
    return array[Math.min(array.length - 1, Math.max(0, index))];
  }
}

export const seededRng = (seed?: number) => new RNG(seed);
