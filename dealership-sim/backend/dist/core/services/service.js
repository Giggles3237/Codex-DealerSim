"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runServiceDepartment = void 0;
const math_1 = require("../../utils/math");
const runServiceDepartment = (technicians, queue, demand, rng) => {
    const activeTechs = technicians.filter((tech) => tech.active);
    const nextQueue = [...queue];
    const completed = [];
    let csiDelta = 0;
    let laborHours = 0;
    let partsRevenue = 0;
    let comebacks = 0;
    let totalJobs = 0;
    // generate new demand
    while (nextQueue.length < demand) {
        nextQueue.push({
            id: `queue-${Date.now()}-${rng.nextFloat()}`,
            status: 'waiting',
            laborHours: (0, math_1.clamp)(1.5 + rng.nextFloat() * 2.5, 1, 5),
            partsRevenue: 0,
            comebackRisk: 0.1 + rng.nextFloat() * 0.15,
        });
    }
    activeTechs.forEach((tech) => {
        const moraleFactor = 1 + (tech.morale - 50) / 200;
        const efficiency = (0, math_1.clamp)(tech.efficiency * moraleFactor, 0.4, 2);
        let capacity = (0, math_1.clamp)(7 * efficiency, 3, 12);
        for (let i = 0; i < nextQueue.length && capacity > 0; i += 1) {
            const job = nextQueue[i];
            if (job.status === 'complete') {
                continue;
            }
            const hours = Math.min(job.laborHours, capacity);
            capacity -= hours;
            job.status = 'complete';
            job.techId = tech.id;
            job.completedOn = new Date().toISOString();
            const parts = hours * 120 * (0.6 + rng.nextFloat() * 0.8);
            job.partsRevenue = parts;
            const comebackChance = (0, math_1.clamp)(job.comebackRisk + tech.comebackRate - moraleFactor * 0.05, 0.02, 0.25);
            const comeback = rng.nextFloat() < comebackChance;
            const csiImpact = comeback ? -5 : 3 * efficiency;
            completed.push({
                id: job.id,
                techId: tech.id,
                date: job.completedOn,
                laborHours: hours,
                partsRevenue: parts,
                comeback,
                csiImpact,
            });
            csiDelta += csiImpact;
            laborHours += hours;
            partsRevenue += parts;
            if (comeback) {
                comebacks += 1;
            }
            totalJobs += 1;
        }
    });
    const remaining = nextQueue.filter((job) => job.status !== 'complete');
    const comebackRate = totalJobs > 0 ? comebacks / totalJobs : 0;
    return { completed, queue: remaining, csiDelta, laborHours, partsRevenue, comebackRate };
};
exports.runServiceDepartment = runServiceDepartment;
