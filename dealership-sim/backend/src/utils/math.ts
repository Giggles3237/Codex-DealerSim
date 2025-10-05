export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export const diminishingReturns = (base: number, k: number) => Math.log(1 + k * base);

export const weightedAverage = (values: number[], weights: number[]) => {
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  if (totalWeight === 0) {
    return 0;
  }
  const weightedSum = values.reduce((acc, value, idx) => acc + value * weights[idx], 0);
  return weightedSum / totalWeight;
};
