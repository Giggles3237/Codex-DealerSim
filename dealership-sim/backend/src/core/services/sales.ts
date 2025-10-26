import {
  Coefficients,
  Customer,
  Deal,
  EconomyState,
  MarketingState,
  SalesAdvisor,
  Vehicle,
} from '@dealership/shared';
import { RNG } from '../../utils/random.js';
import { diminishingReturns, clamp, sigmoid } from '../../utils/math.js';
import { CUSTOMER_ARCHETYPES, ADVISOR_ARCHETYPES } from '../balance/archetypes.js';

export interface LeadActivity {
  id: string;
  timestamp: string;
  advisorId?: string;
  advisorName?: string;
  customerType: string;
  outcome: 'lead' | 'appointment' | 'sale' | 'no_show';
  vehicleId?: string;
  vehicleInfo?: string;
  gross?: number;
}

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
  leadActivity: LeadActivity[];
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
  // Don't sell vehicles on the same day they arrive (ageDays === 0)
  const eligible = inventory.filter((vehicle) => 
    vehicle.status === 'inStock' && 
    vehicle.ageDays > 0 && // Must have been in stock for at least 1 day
    (bevPreference ? vehicle.condition === 'bev' || vehicle.segment === 'ev' : true)
  );
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

export const simulateSalesHour = (
  advisors: SalesAdvisor[],
  inventory: Vehicle[],
  marketing: MarketingState,
  economy: EconomyState,
  coefficients: Coefficients,
  rng: RNG,
  hour: number, // Current hour (9-21)
): SalesDayResult => {
  // Distribute daily activity across 12 business hours (9 AM - 9 PM)
  // More activity during peak hours (10 AM - 2 PM, 5 PM - 8 PM)
  let hourMultiplier = 1.0;
  if (hour >= 10 && hour <= 14) {
    hourMultiplier = 1.3; // Lunch rush
  } else if (hour >= 17 && hour <= 20) {
    hourMultiplier = 1.2; // Evening rush
  } else if (hour === 9 || hour === 21) {
    hourMultiplier = 0.6; // Opening/closing hours are slower
  }
  
  const dailyLeads = computeLeadVolume(marketing, economy, coefficients);
  const leads = Math.max(0, Math.round((dailyLeads / 12) * hourMultiplier));
  const appointments = Math.max(0, Math.round(leads * (0.45 + economy.demandIndex * 0.15)));
  const dealsWorked = Math.max(0, Math.round(appointments * 0.6));

  const deals: Deal[] = [];
  const soldVehicles: Vehicle[] = [];
  const remainingInventory = [...inventory];
  const customers: Customer[] = [];
  const leadActivity: LeadActivity[] = [];
  let cashDelta = 0; // No marketing spend here - that's handled at end of day
  let csiDelta = 0;
  let moraleDelta = 0;

  // Generate lead activity with realistic timestamps for this hour
  const now = new Date();
  const baseTime = now.getTime();
  
  // Create lead activity for each step in the funnel
  for (let i = 0; i < leads; i += 1) {
    const customer = createCustomer(rng);
    const timeOffset = Math.floor(rng.nextFloat() * 3600000); // Random time within the hour
    leadActivity.push({
      id: `lead-${baseTime}-${i}`,
      timestamp: new Date(baseTime + timeOffset).toISOString(),
      customerType: customer.type,
      outcome: 'lead'
    });
  }
  
  // Create appointment activity
  for (let i = 0; i < appointments; i += 1) {
    const advisor = pickAdvisor(advisors, rng);
    if (advisor) {
      const timeOffset = Math.floor(rng.nextFloat() * 3600000);
      leadActivity.push({
        id: `appt-${baseTime}-${i}`,
        timestamp: new Date(baseTime + timeOffset).toISOString(),
        advisorId: advisor.id,
        advisorName: advisor.name,
        customerType: 'Walk-in',
        outcome: 'appointment'
      });
    }
  }

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
      const timeOffset = Math.floor(rng.nextFloat() * 3600000);
      const deal: Deal = {
        id: `deal-${baseTime}-${i}`,
        vehicleId: vehicle.id,
        advisorId: advisor.id,
        customerId: customer.id,
        date: new Date(baseTime + timeOffset).toISOString(),
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
      // Add full sale price back to cash (cost was already paid when vehicle was acquired)
      cashDelta += soldPrice;
      csiDelta += deal.csiImpact;
      moraleDelta += advisor.morale > 60 ? 0.2 : 0.1;
      
      // Add sale activity
      const saleTimeOffset = Math.floor(rng.nextFloat() * 3600000);
      leadActivity.push({
        id: `sale-${baseTime}-${i}`,
        timestamp: new Date(baseTime + saleTimeOffset).toISOString(),
        advisorId: advisor.id,
        advisorName: advisor.name,
        customerType: customer.type,
        outcome: 'sale',
        vehicleId: vehicle.id,
        vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        gross: deal.totalGross
      });
    } else {
      moraleDelta -= 0.05;
      
      // Add no-sale activity
      const noSaleTimeOffset = Math.floor(rng.nextFloat() * 3600000);
      leadActivity.push({
        id: `no-sale-${baseTime}-${i}`,
        timestamp: new Date(baseTime + noSaleTimeOffset).toISOString(),
        advisorId: advisor.id,
        advisorName: advisor.name,
        customerType: customer.type,
        outcome: 'no_show'
      });
    }
  }

  return {
    deals,
    soldVehicles,
    remainingInventory,
    leadsGenerated: leads,
    appointments,
    dealsWorked,
    cashDelta: cashDelta, // Sales revenue (sale price goes back to cash)
    csiDelta,
    moraleDelta,
    customers,
    leadActivity,
  };
};

// For backwards compatibility and testing
export const simulateSalesDay = (
  advisors: SalesAdvisor[],
  inventory: Vehicle[],
  marketing: MarketingState,
  economy: EconomyState,
  coefficients: Coefficients,
  rng: RNG,
): SalesDayResult => {
  // Simulate all 12 hours at once
  let aggregatedResult: SalesDayResult = {
    deals: [],
    soldVehicles: [],
    remainingInventory: inventory,
    leadsGenerated: 0,
    appointments: 0,
    dealsWorked: 0,
    cashDelta: -marketing.spendPerDay,
    csiDelta: 0,
    moraleDelta: 0,
    customers: [],
    leadActivity: [],
  };

  for (let hour = 9; hour <= 21; hour++) {
    const hourResult = simulateSalesHour(
      advisors,
      aggregatedResult.remainingInventory,
      marketing,
      economy,
      coefficients,
      rng,
      hour
    );
    
    aggregatedResult.deals.push(...hourResult.deals);
    aggregatedResult.soldVehicles.push(...hourResult.soldVehicles);
    aggregatedResult.remainingInventory = hourResult.remainingInventory;
    aggregatedResult.leadsGenerated += hourResult.leadsGenerated;
    aggregatedResult.appointments += hourResult.appointments;
    aggregatedResult.dealsWorked += hourResult.dealsWorked;
    aggregatedResult.cashDelta += hourResult.cashDelta;
    aggregatedResult.csiDelta += hourResult.csiDelta;
    aggregatedResult.moraleDelta += hourResult.moraleDelta;
    aggregatedResult.customers.push(...hourResult.customers);
    aggregatedResult.leadActivity.push(...hourResult.leadActivity);
  }

  return aggregatedResult;
};

export const __testing = {
  computeClosingProbability,
  computeSoldPrice,
};
