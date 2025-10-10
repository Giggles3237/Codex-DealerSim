import { randomUUID } from 'crypto';
import { Coefficients, Vehicle, PricingPolicy, PricingState, PRICING_POLICY_MULTIPLIERS } from '@dealership/shared';
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
    const newAsking = Math.round((vehicle.asking - depreciation) / 100) * 100;
    return {
      ...vehicle,
      ageDays,
      asking: Math.max(vehicle.floor, newAsking),
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

export const applyPricingPolicy = (
  baseAsking: number,
  policy: PricingPolicy,
  desirability: number,
  ageDays: number,
  agingDiscounts: PricingState['agingDiscounts'],
): number => {
  let multiplier = PRICING_POLICY_MULTIPLIERS[policy];
  
  // Market policy adjusts based on desirability
  if (policy === 'market') {
    if (desirability >= 80) {
      multiplier = 1.08; // High desirability: price premium
    } else if (desirability >= 60) {
      multiplier = 1.02; // Good desirability: slight premium
    } else if (desirability >= 40) {
      multiplier = 0.98; // Average: slight discount
    } else {
      multiplier = 0.92; // Low desirability: deeper discount
    }
  }
  
  let asking = baseAsking * multiplier;
  
  // Apply aging discounts
  if (ageDays >= 90) {
    asking *= (1 - agingDiscounts.days90);
  } else if (ageDays >= 60) {
    asking *= (1 - agingDiscounts.days60);
  }
  
  return asking;
};

export const createVehicle = (
  overrides: Partial<Vehicle>,
  rng: RNG,
  coefficients: Coefficients,
  baseCost: number,
  pricingState?: PricingState,
): Vehicle => {
  const holdbackPct = coefficients.pricing.holdbackPct;
  const pack = coefficients.pricing.pack;
  const recon = Math.max(200, coefficients.pricing.reconMean * (0.8 + rng.nextFloat() * 0.4));
  const baseAsking = Math.round(baseCost * (1.18 + rng.nextFloat() * 0.08) / 100) * 100;
  
  const segment = overrides.segment ?? 'sedan';
  const desirability = overrides.desirability ?? clamp(55 + rng.nextFloat() * 30, 30, 100);
  const ageDays = overrides.ageDays ?? 0;
  
  // Apply pricing policy if provided
  let asking = baseAsking;
  if (pricingState) {
    const policy = pricingState.segmentPolicies[segment] ?? pricingState.globalPolicy;
    asking = Math.round(applyPricingPolicy(baseAsking, policy, desirability, ageDays, pricingState.agingDiscounts) / 100) * 100;
  }
  
  const roundedCost = Math.round(baseCost / 100) * 100;
  const floor = baseCost * 1.02; // Keep floor precise for interest calculations
  
  return {
    id: randomUUID(),
    stockNumber: `STK-${Math.floor(rng.nextFloat() * 90000 + 10000)}`,
    year: overrides.year ?? 2024,
    make: overrides.make ?? 'Bimmer',
    model: overrides.model ?? 'Series',
    segment,
    cost: roundedCost,
    floor: floor,
    asking,
    baseAsking,
    ageDays,
    desirability,
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
  pricingState?: PricingState,
): AcquirePackResult => {
  const vehicles: Vehicle[] = [];
  let totalCost = 0;
  for (let i = 0; i < qty; i += 1) {
    const baseCostMultiplier =
      type === 'desirable' ? 1.12 : type === 'neutral' ? 1 : type === 'undesirable' ? 0.88 : 1;
    const baseCost = Math.round(28000 * baseCostMultiplier * (0.9 + rng.nextFloat() * 0.3) / 100) * 100;
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
      pricingState,
    );
    totalCost += baseCost + vehicle.reconCost + vehicle.pack;
    vehicles.push(vehicle);
  }
  return { vehicles, cost: Math.round(totalCost / 100) * 100 };
};

export const estimateDaysSupply = (inventory: Vehicle[], trailingSales: number): number => {
  if (trailingSales === 0) {
    return inventory.length * 10;
  }
  return (inventory.length / trailingSales) * 30;
};

