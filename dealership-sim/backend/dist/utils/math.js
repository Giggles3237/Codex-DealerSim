"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weightedAverage = exports.diminishingReturns = exports.sigmoid = exports.clamp = void 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
exports.clamp = clamp;
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
exports.sigmoid = sigmoid;
const diminishingReturns = (base, k) => Math.log(1 + k * base);
exports.diminishingReturns = diminishingReturns;
const weightedAverage = (values, weights) => {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    if (totalWeight === 0) {
        return 0;
    }
    const weightedSum = values.reduce((acc, value, idx) => acc + value * weights[idx], 0);
    return weightedSum / totalWeight;
};
exports.weightedAverage = weightedAverage;
