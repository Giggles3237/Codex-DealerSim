import {
  Coefficients,
  Customer,
  Deal,
  EconomyState,
  MarketingState,
  SalesAdvisor,
  Vehicle,
} from '@dealership/shared';
import { RNG } from '../../utils/random';
import { diminishingReturns, clamp, sigmoid } from '../../utils/math';
import { CUSTOMER_ARCHETYPES, ADVISOR_ARCHETYPES } from '../balance/archetypes';

export interface SalesDayResult {
  deals: Deal[];
  soldVehicles: Vehicle[];
  remainingInventory: Vehicle[];
  leadsGenerated: number;
  appointments: number;
  dealsWorked: number;
  cashDelta: number;
  csiDelta: number;
  moraleDelta: number;
  customers: Customer[];
}

const BASE_COST_PER_LEAD = 8;

const createCustomer = (rng: RNG): Customer => {
  const archetype = rng.pick(CUSTOMER_ARCHETYPES);
  return {
    id: `cust-${Date.now()}-${rng.nextFloat()}`,
    type: archetype.name,
    channel: rng.pick(['walk-in', 'web', 'phone', 'referral'] as const),
    priceSensitivity: clamp(0.3 + archetype.modifiers.priceSensitivity, 0, 1),
    paymentFocus: clamp(0.3 + rng.nextFloat() * 0.4, 0, 1),
    loyalty: clamp(0.2 + archetype.modifiers.loyalty, 0, 1),
    closeBias: archetype.modifiers.closeBias,
    grossBias: archetype.modifiers.grossBias,
    csiBias: archetype.modifiers.csiBias,
    bevAffinity: archetype.modifiers.bevAffinity,
  };
};

const advisorArchetypeModifier = (advisor: SalesAdvisor): number => {
  const found = ADVISOR_ARCHETYPES.find((arch) => arch.id === advisor.archetype);
  return found ? found.modifiers.close : 0;
};

const advisorBackModifier = (advisor: SalesAdvisor): number => {
  const found = ADVISOR_ARCHETYPES.find((arch) => arch.id === advisor.archetype);
  return found ? found.modifiers.backGross : 0;
};

const advisorMoraleEffect = (advisor: SalesAdvisor): number => {
  return (advisor.morale - 50) / 200;
};

export const computeLeadVolume = (
  marketing: MarketingState,
  economy: EconomyState,
  coefficients: Coefficients,
): number => {
  const marketingBoost = 1 + coefficients.lead.marketingK * diminishingReturns(marketing.spendPerDay / BASE_COST_PER_LEAD, coefficients.lead.diminishingK);
  const weatherPenalty = 0.6 + economy.weatherFactor * 0.4;
  const incentivesBoost = 1 + economy.incentiveLevel * 0.4;
  return coefficients.lead.basePerDay * economy.demandIndex * marketingBoost * weatherPenalty * incentivesBoost;
};

const pickAdvisor = (advisors: SalesAdvisor[], rng: RNG): SalesAdvisor | null => {
  const active = advisors.filter((advisor) => advisor.active);
  if (!active.length) {
    return null;
  }
  return rng.pick(active);
};

const pickVehicle = (inventory: Vehicle[], customer: Customer): Vehicle | null => {
  const bevPreference = customer.bevAffinity > 0.1;
  const eligible = inventory.filter((vehicle) => vehicle.status === 'inStock' && (bevPreference ? vehicle.condition === 'bev' || vehicle.segment === 'ev' : true));
  const sorted = eligible.sort((a, b) => b.desirability - a.desirability);
  return sorted[0] ?? null;
};

const computeClosingProbability = (
  advisor: SalesAdvisor,
  customer: Customer,
  vehicle: Vehicle,
  economy: EconomyState,
  coefficients: Coefficients,
): number => {
  const advisorClose = (advisor.skill.close - 50) / 50 + advisorArchetypeModifier(advisor);
  const customerClose = customer.closeBias;
  const desirabilityZ = (vehicle.desirability - 60) / 25;
  const economyFactor = (economy.demandIndex - 1) * coefficients.sales.economyWeight;
  const priceGap = (vehicle.asking - vehicle.cost) / Math.max(vehicle.cost, 1);
  const priceFit = -priceGap * (0.5 + customer.priceSensitivity);
  const morale = advisorMoraleEffect(advisor);
  const raw =
    coefficients.sales.baseClose +
    coefficients.sales.archetypeWeight * (advisorClose + morale) +
    coefficients.sales.desirabilityWeight * desirabilityZ +
    coefficients.sales.priceGapWeight * priceFit +
    customerClose +
    economyFactor;
  return clamp(sigmoid(raw), 0.05, 0.95);
};

const computeSoldPrice = (
  vehicle: Vehicle,
  coefficients: Coefficients,
  rng: RNG,
  customer: Customer,
  economy: EconomyState,
): number => {
  const variance = (rng.nextFloat() * 2 - 1) * coefficients.pricing.variancePct;
  const incentiveBias = economy.incentiveLevel * 1000;
  const discount = customer.priceSensitivity * 700;
  const sold = vehicle.asking * (1 + variance) + incentiveBias - discount;
  return Math.max(vehicle.floor, sold);
};

const computeFrontGross = (vehicle: Vehicle, soldPrice: number, coefficients: Coefficients): number => {
  const holdback = soldPrice * vehicle.holdbackPct;
  const costBasis = vehicle.cost + vehicle.reconCost + vehicle.pack;
  return soldPrice - costBasis + holdback;
};

const computeBackGross = (
  advisor: SalesAdvisor,
  coefficients: Coefficients,
  rng: RNG,
  economy: EconomyState,
): number => {
  const baseProb = coefficients.finance.backGrossProb + advisorBackModifier(advisor);
  const interestPenalty = (economy.interestRate - 5) / 10;
  const finalProb = clamp(baseProb - interestPenalty, 0.1, 0.9);
  return rng.nextFloat() < finalProb
    ? coefficients.finance.avgBackGross * (1 + (advisor.skill.gross - 50) / 100)
    : 0;
};

export const simulateSalesDay = (
  advisors: SalesAdvisor[],
  inventory: Vehicle[],
  marketing: MarketingState,
  economy: EconomyState,
  coefficients: Coefficients,
  rng: RNG,
): SalesDayResult => {
  const leads = Math.round(computeLeadVolume(marketing, economy, coefficients));
  const appointments = Math.round(leads * (0.45 + economy.demandIndex * 0.15));
  const dealsWorked = Math.round(appointments * 0.6);

  const deals: Deal[] = [];
  const soldVehicles: Vehicle[] = [];
  const remainingInventory = [...inventory];
  const customers: Customer[] = [];
  let cashDelta = -marketing.spendPerDay;
  let csiDelta = 0;
  let moraleDelta = 0;

  for (let i = 0; i < dealsWorked; i += 1) {
    const advisor = pickAdvisor(advisors, rng);
    if (!advisor) {
      break;
    }
    const customer = createCustomer(rng);
    const vehicle = pickVehicle(remainingInventory, customer);
    if (!vehicle) {
      break;
    }
    customers.push(customer);
    const closeProb = computeClosingProbability(advisor, customer, vehicle, economy, coefficients);
    if (rng.nextFloat() <= closeProb) {
      const soldPrice = computeSoldPrice(vehicle, coefficients, rng, customer, economy);
      const frontGross = computeFrontGross(vehicle, soldPrice, coefficients);
      const backGross = computeBackGross(advisor, coefficients, rng, economy);
      const totalGross = frontGross + backGross;
      const deal: Deal = {
        id: `deal-${Date.now()}-${i}`,
        vehicleId: vehicle.id,
        advisorId: advisor.id,
        customerId: customer.id,
        date: new Date().toISOString(),
        frontGross,
        backGross,
        totalGross,
        csiImpact: Math.max(-5, 5 * (advisor.skill.csi / 50 + customer.csiBias)),
        soldPrice,
      };
      deals.push(deal);
      soldVehicles.push({ ...vehicle, status: 'sold' });
      const index = remainingInventory.findIndex((item) => item.id === vehicle.id);
      if (index >= 0) {
        remainingInventory.splice(index, 1);
      }
      cashDelta += soldPrice - (vehicle.cost + vehicle.reconCost + vehicle.pack);
      csiDelta += deal.csiImpact;
      moraleDelta += advisor.morale > 60 ? 0.2 : 0.1;
    } else {
      moraleDelta -= 0.05;
    }
  }

  return {
    deals,
    soldVehicles,
    remainingInventory,
    leadsGenerated: leads,
    appointments,
    dealsWorked,
    cashDelta,
    csiDelta,
    moraleDelta,
    customers,
  };
};

export const __testing = {
  computeClosingProbability,
  computeSoldPrice,
};
