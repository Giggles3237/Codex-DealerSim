export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const diminishingReturns = (base, k) => Math.log(1 + k * base);
export const weightedAverage = (values, weights) => {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    if (totalWeight === 0) {
        return 0;
    }
    const weightedSum = values.reduce((acc, value, idx) => acc + value * weights[idx], 0);
    return weightedSum / totalWeight;
};
