import { useState } from 'react';
import { GameState, Vehicle, PricingPolicy, PRICING_POLICY_MULTIPLIERS } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useGameStore } from '../../state/useGameStore';

interface Props {
  state: GameState;
}

const POLICY_LABELS: Record<PricingPolicy, string> = {
  aggressive: 'Aggressive (-5%)',
  balanced: 'Balanced (Market)',
  conservative: 'Conservative (+5%)',
  market: 'Dynamic (Desirability-Based)',
};

const InventoryView = ({ state }: Props) => {
  const { acquireInventory, setPricingPolicy, adjustVehiclePrice, setAgingDiscounts } = useGameStore();
  const [priceAdjustments, setPriceAdjustments] = useState<Record<string, string>>({});
  const [buyQuantity, setBuyQuantity] = useState<number>(2);

  const grouped = state.inventory.reduce<Record<string, Vehicle[]>>((acc, vehicle) => {
    acc[vehicle.status] = acc[vehicle.status] || [];
    acc[vehicle.status].push(vehicle);
    return acc;
  }, {});

  // Calculate max inventory slots from purchased upgrades
  const getMaxInventorySlots = () => {
    let max = 15; // Base capacity
    if (state.purchasedUpgrades.includes('inventory_expansion_1')) max = Math.max(max, 30);
    if (state.purchasedUpgrades.includes('inventory_expansion_2')) max = Math.max(max, 60);
    if (state.purchasedUpgrades.includes('inventory_expansion_3')) max = Math.max(max, 100);
    if (state.purchasedUpgrades.includes('inventory_expansion_4')) max = Math.max(max, 200);
    return max;
  };

  // Lot size determines average vehicle cost - smaller lots = smaller/cheaper vehicles
  const maxInventorySlots = getMaxInventorySlots();
  const avgCostPerUnit = Math.round((15000 + (maxInventorySlots * 150)) / 100) * 100; // Round to hundreds
  
  // Add pack per vehicle (recon happens when vehicles arrive)
  const pack = 450;
  const estimatedCostPerUnit = avgCostPerUnit + pack;
  const estimatedCost = estimatedCostPerUnit * buyQuantity;
  const canAfford = estimatedCost <= state.cash;

  // Check if used car manager is hired (unlocks pricing strategy)
  const hasUsedCarManager = state.purchasedUpgrades.includes('used_car_manager');
  
  // Check if auction is open (closes at 4 PM)
  const auctionOpen = state.hour < 16;

  const ageBadge = (age: number) => {
    if (age > 90) return <Badge variant="danger">Aged</Badge>;
    if (age > 60) return <Badge variant="warning">60+</Badge>;
    return <Badge variant="success">Fresh</Badge>;
  };

  const handlePriceAdjustment = (vehicleId: string, value: string) => {
    setPriceAdjustments((prev) => ({ ...prev, [vehicleId]: value }));
  };

  const applyPriceAdjustment = (vehicleId: string) => {
    const value = priceAdjustments[vehicleId];
    if (value) {
      const adjustment = parseFloat(value);
      if (!isNaN(adjustment)) {
        adjustVehiclePrice(vehicleId, adjustment);
        setPriceAdjustments((prev) => {
          const next = { ...prev };
          delete next[vehicleId];
          return next;
        });
      }
    }
  };

  const segments: Vehicle['segment'][] = ['luxury', 'performance', 'suv', 'sedan', 'compact', 'ev', 'crossover', 'convertible'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buy Inventory</CardTitle>
          <CardDescription>
            Purchase vehicles at auction. Avg vehicle: ${avgCostPerUnit.toLocaleString()} + pack ≈ ${estimatedCostPerUnit.toLocaleString()}/unit
            <span className="block mt-1 text-xs text-slate-400">Recon costs ($200-$800) will be charged when vehicles arrive at noon.</span>
            {!auctionOpen && <span className="text-red-400"> • Auction closed (opens 9 AM - 4 PM)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-300">Quantity</label>
              <input
                type="number"
                min="1"
                max="20"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-lg"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-300">Estimated Cost</label>
              <div className={`mt-1 text-lg font-semibold ${canAfford ? 'text-green-400' : 'text-red-500'}`}>
                ${estimatedCost.toLocaleString()}
              </div>
              <div className={`text-xs ${canAfford ? 'text-slate-500' : 'text-red-400'}`}>
                Available: ${Math.round(state.cash).toLocaleString()}
              </div>
            </div>
            <Button 
              onClick={() => acquireInventory('neutral', buyQuantity)}
              disabled={!canAfford || !auctionOpen}
              size="lg"
            >
              {auctionOpen ? `Buy ${buyQuantity} ${buyQuantity === 1 ? 'Vehicle' : 'Vehicles'}` : 'Auction Closed'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasUsedCarManager && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Strategy</CardTitle>
            <CardDescription>Set global and segment-specific pricing policies to maximize gross or move aged inventory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Global Pricing Policy</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(POLICY_LABELS).map(([policy, label]) => (
                  <Button
                    key={policy}
                    variant={state.pricing.globalPolicy === policy ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPricingPolicy(policy as PricingPolicy)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Segment-Specific Policies</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {segments.map((segment) => {
                  const currentPolicy = state.pricing.segmentPolicies[segment] || state.pricing.globalPolicy;
                  return (
                    <div key={segment} className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">{segment}</p>
                      <select
                        className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-sm"
                        value={currentPolicy}
                        onChange={(e) => setPricingPolicy(undefined, segment, e.target.value as PricingPolicy)}
                      >
                        {Object.entries(POLICY_LABELS).map(([policy, label]) => (
                          <option key={policy} value={policy}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Aging Discounts</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400">60+ Days Discount (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="50"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2"
                    value={(state.pricing.agingDiscounts.days60 * 100).toFixed(0)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) / 100;
                      setAgingDiscounts(val, state.pricing.agingDiscounts.days90);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">90+ Days Discount (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="50"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2"
                    value={(state.pricing.agingDiscounts.days90 * 100).toFixed(0)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) / 100;
                      setAgingDiscounts(state.pricing.agingDiscounts.days60, val);
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {(grouped['pending'] || []).map((vehicle) => (
          <Card key={vehicle.id} className="border-yellow-500/30 bg-gradient-to-r from-yellow-950/20 to-slate-900/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </CardTitle>
              <CardDescription>
                Stock #{vehicle.stockNumber} · {vehicle.segment.toUpperCase()} · {vehicle.condition.toUpperCase()} · <span className="text-yellow-400">PENDING DELIVERY</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-yellow-700 bg-yellow-900/20 p-4 text-center">
                <p className="text-yellow-400 font-semibold">🚛 Arriving Tomorrow at Noon</p>
                <p className="text-sm text-yellow-300 mt-1">Vehicle purchased at auction, in transit</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {(grouped['inStock'] || []).map((vehicle) => (
          <Card key={vehicle.id}>
            <CardHeader>
              <CardTitle>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </CardTitle>
              <CardDescription>
                Stock #{vehicle.stockNumber} · {vehicle.segment.toUpperCase()} · {vehicle.condition.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                <div>
                  <p>Asking Price</p>
                  <p className="text-lg font-semibold text-foreground">${Math.round(vehicle.asking).toLocaleString()}</p>
                  {vehicle.manualPriceAdjustment && (
                    <p className="text-xs text-blue-400">
                      Manual: {vehicle.manualPriceAdjustment > 0 ? '+' : ''}${vehicle.manualPriceAdjustment.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <p>Cost Basis</p>
                  <p className="text-lg font-semibold text-foreground">${Math.round(vehicle.cost + vehicle.reconCost + vehicle.pack).toLocaleString()}</p>
                </div>
                <div>
                  <p>Desirability</p>
                  <p className="text-lg font-semibold">{Math.round(vehicle.desirability)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p>Age: {vehicle.ageDays} days</p>
                  {ageBadge(vehicle.ageDays)}
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-3">
                <label className="text-xs text-slate-400">Manual Price Adjustment ($)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    step="100"
                    placeholder="e.g., -500 or +1000"
                    className="flex-1 rounded-md border border-slate-700 bg-slate-800 p-2 text-sm"
                    value={priceAdjustments[vehicle.id] || ''}
                    onChange={(e) => handlePriceAdjustment(vehicle.id, e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => applyPriceAdjustment(vehicle.id)}
                    disabled={!priceAdjustments[vehicle.id]}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InventoryView;
