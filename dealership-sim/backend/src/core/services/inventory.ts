import { v4 as uuid } from 'uuid';
import { Coefficients, Vehicle } from '@dealership/shared';
import { RNG } from '../../utils/random';
import { clamp } from '../../utils/math';

const SEGMENT_BASE_DEMAND: Record<Vehicle['segment'], number> = {
  luxury: 0.9,
  performance: 0.8,
  suv: 1.1,
  sedan: 0.95,
  compact: 1,
  ev: 1.05,
  crossover: 1.1,
  convertible: 0.7,
};

const CONDITION_DESIRABILITY: Record<Vehicle['condition'], number> = {
  new: 1,
  used: 0.85,
  cpo: 0.95,
  bev: 1.1,
};

const AGE_DEPRECIATION = [
  { max: 30, rate: 0.001 },
  { max: 60, rate: 0.0025 },
  { max: 120, rate: 0.004 },
  { max: Infinity, rate: 0.006 },
];

export interface AcquirePackResult {
  vehicles: Vehicle[];
  cost: number;
}

export const ageInventory = (inventory: Vehicle[], economyDemand: number): Vehicle[] => {
  return inventory.map((vehicle) => {
    const ageDays = vehicle.ageDays + 1;
    const bucket = AGE_DEPRECIATION.find((entry) => ageDays <= entry.max) ?? AGE_DEPRECIATION[AGE_DEPRECIATION.length - 1];
    const desirabilityFactor = (vehicle.desirability / 100) * economyDemand;
    const depreciation = vehicle.asking * bucket.rate * (1.2 - desirabilityFactor / 2);
    return {
      ...vehicle,
      ageDays,
      asking: Math.max(vehicle.floor, vehicle.asking - depreciation),
      desirability: clamp(vehicle.desirability - bucket.rate * 100 * (1.1 - desirabilityFactor), 10, 100),
    };
  });
};

export const calculateDesirability = (vehicle: Vehicle, economySeason: string, demandIndex: number): number => {
  const base = 60;
  const segmentDemand = SEGMENT_BASE_DEMAND[vehicle.segment];
  const seasonBonus =
    economySeason === 'winter' && vehicle.segment === 'suv'
      ? 10
      : economySeason === 'summer' && vehicle.segment === 'convertible'
      ? 12
      : 0;
  const conditionBonus = 20 * CONDITION_DESIRABILITY[vehicle.condition];
  return clamp(base + segmentDemand * 15 + seasonBonus + conditionBonus + demandIndex * 10, 20, 100);
};

export const createVehicle = (
  overrides: Partial<Vehicle>,
  rng: RNG,
  coefficients: Coefficients,
  baseCost: number,
): Vehicle => {
  const holdbackPct = coefficients.pricing.holdbackPct;
  const pack = coefficients.pricing.pack;
  const recon = Math.max(200, coefficients.pricing.reconMean * (0.8 + rng.nextFloat() * 0.4));
  const asking = baseCost * (1.18 + rng.nextFloat() * 0.08);
  return {
    id: uuid(),
    stockNumber: `STK-${Math.floor(rng.nextFloat() * 90000 + 10000)}`,
    year: overrides.year ?? 2024,
    make: overrides.make ?? 'Bimmer',
    model: overrides.model ?? 'Series',
    segment: overrides.segment ?? 'sedan',
    cost: baseCost,
    floor: baseCost * 1.02,
    asking,
    ageDays: overrides.ageDays ?? 0,
    desirability: overrides.desirability ?? clamp(55 + rng.nextFloat() * 30, 30, 100),
    condition: overrides.condition ?? 'new',
    reconCost: recon,
    holdbackPct: holdbackPct,
    pack,
    status: overrides.status ?? 'inStock',
  } as Vehicle;
};

export const acquirePack = (
  type: 'desirable' | 'neutral' | 'undesirable',
  qty: number,
  rng: RNG,
  coefficients: Coefficients,
): AcquirePackResult => {
  const vehicles: Vehicle[] = [];
  let totalCost = 0;
  for (let i = 0; i < qty; i += 1) {
    const baseCostMultiplier =
      type === 'desirable' ? 1.12 : type === 'neutral' ? 1 : type === 'undesirable' ? 0.88 : 1;
    const baseCost = 28000 * baseCostMultiplier * (0.9 + rng.nextFloat() * 0.3);
    const segmentPool: Vehicle['segment'][] = type === 'desirable' ? ['suv', 'ev', 'crossover'] : type === 'undesirable' ? ['sedan', 'compact'] : ['sedan', 'crossover', 'suv'];
    const condition: Vehicle['condition'] = type === 'desirable' ? 'bev' : type === 'undesirable' ? 'used' : 'cpo';
    const vehicle = createVehicle(
      {
        segment: rng.pick(segmentPool),
        condition,
        desirability:
          type === 'desirable'
            ? 80 + rng.nextFloat() * 20
            : type === 'neutral'
            ? 55 + rng.nextFloat() * 25
            : 40 + rng.nextFloat() * 20,
      },
      rng,
      coefficients,
      baseCost,
    );
    totalCost += baseCost + vehicle.reconCost + vehicle.pack;
    vehicles.push(vehicle);
  }
  return { vehicles, cost: totalCost };
};

export const estimateDaysSupply = (inventory: Vehicle[], trailingSales: number): number => {
  if (trailingSales === 0) {
    return inventory.length * 10;
  }
  return (inventory.length / trailingSales) * 30;
};

export const autoRestock = (
  inventory: Vehicle[],
  cash: number,
  coefficients: Coefficients,
  rng: RNG,
  trailingSales: number,
): { newVehicles: Vehicle[]; cashSpent: number } => {
  const daysSupply = estimateDaysSupply(inventory, Math.max(1, trailingSales));
  if (daysSupply >= coefficients.inventory.minDaysSupply) {
    return { newVehicles: [], cashSpent: 0 };
  }
  const units = coefficients.inventory.bulkBuyUnits;
  const pack = acquirePack('neutral', units, rng, coefficients);
  const costPerUnit = pack.cost / units;
  const affordableUnits = Math.min(units, Math.floor(cash / costPerUnit));
  if (affordableUnits <= 0) {
    return { newVehicles: [], cashSpent: 0 };
  }
  const selected = acquirePack('neutral', affordableUnits, rng, coefficients);
  return { newVehicles: selected.vehicles, cashSpent: selected.cost };
};
