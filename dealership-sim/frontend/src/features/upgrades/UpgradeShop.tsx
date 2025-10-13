import { GameState, Upgrade } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useGameStore } from '../../state/useGameStore';

interface Props {
  state: GameState;
}

const categoryColors = {
  staff: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  facilities: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  automation: 'bg-green-500/20 text-green-400 border-green-500/30',
  capacity: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  efficiency: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const categoryIcons = {
  staff: '👥',
  facilities: '🏢',
  automation: '🤖',
  capacity: '📦',
  efficiency: '⚡',
};

const UpgradeCard = ({ upgrade, canAfford, onPurchase }: {
  upgrade: Upgrade;
  canAfford: boolean;
  onPurchase: () => void;
}) => {
  const isPurchased = upgrade.purchased;
  
  return (
    <Card className={`relative ${isPurchased ? 'opacity-50 border-green-500/50' : 'border-slate-700'}`}>
      {isPurchased && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">✓ Purchased</Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryIcons[upgrade.category]}</span>
              <Badge className={categoryColors[upgrade.category]}>
                {upgrade.category}
              </Badge>
            </div>
            <CardTitle className="text-xl">{upgrade.name}</CardTitle>
            <CardDescription className="mt-2">{upgrade.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Requirements met display */}
          {upgrade.requirements && Object.keys(upgrade.requirements).length > 0 && (
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-semibold">Requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-2">
                {upgrade.requirements.revenue && (
                  <li className="text-green-400">
                    ${upgrade.requirements.revenue.toLocaleString()} total revenue ✓
                  </li>
                )}
                {upgrade.requirements.lifetimeSales && (
                  <li className="text-green-400">
                    {upgrade.requirements.lifetimeSales} lifetime sales ✓
                  </li>
                )}
                {upgrade.requirements.csi && (
                  <li className="text-green-400">
                    {upgrade.requirements.csi}+ CSI rating ✓
                  </li>
                )}
              </ul>
            </div>
          )}
          
          {/* Effects */}
          {upgrade.effects && (
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-blue-400">Effects:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-2">
                {upgrade.effects.maxAdvisors && (
                  <li>Max advisors: {upgrade.effects.maxAdvisors}</li>
                )}
                {upgrade.effects.maxTechnicians && (
                  <li>Max technicians: {upgrade.effects.maxTechnicians}</li>
                )}
                {upgrade.effects.maxInventorySlots && (
                  <li>Max inventory: {upgrade.effects.maxInventorySlots} slots</li>
                )}
                {upgrade.effects.unlockService && (
                  <li>Unlocks service department</li>
                )}
                {upgrade.effects.enableAutoAdvance && (
                  <li>Enables auto-advance</li>
                )}
                {upgrade.effects.enableAutoBuyer && (
                  <li>Enables automatic inventory purchasing</li>
                )}
                {upgrade.effects.enableAutoPricer && (
                  <li>Enables automatic pricing adjustments</li>
                )}
                {upgrade.effects.enableMarketingOptimizer && (
                  <li>Enables automatic marketing optimization</li>
                )}
                {upgrade.effects.speedMultiplier && (
                  <li>Unlock {upgrade.effects.speedMultiplier}x speed</li>
                )}
              </ul>
            </div>
          )}
          
          {/* Purchase button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="text-2xl font-bold">
              <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                ${upgrade.cost.toLocaleString()}
              </span>
            </div>
            <Button
              onClick={onPurchase}
              disabled={!canAfford || isPurchased}
              variant={canAfford && !isPurchased ? "default" : "outline"}
              className={canAfford && !isPurchased ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isPurchased ? 'Purchased' : canAfford ? 'Purchase' : 'Insufficient Funds'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const UpgradeShop = ({ state }: Props) => {
  const { purchaseUpgrade } = useGameStore();
  
  // Filter and sort upgrades
  const availableUpgrades = (state.availableUpgrades || [])
    .filter(u => u.unlocked)
    .sort((a, b) => {
      // Show unpurchased first, then sort by cost
      if (a.purchased !== b.purchased) {
        return a.purchased ? 1 : -1;
      }
      return a.cost - b.cost;
    });
  
  // Group by category
  const upgradesByCategory = availableUpgrades.reduce((acc, upgrade) => {
    if (!acc[upgrade.category]) {
      acc[upgrade.category] = [];
    }
    acc[upgrade.category].push(upgrade);
    return acc;
  }, {} as Record<string, Upgrade[]>);
  
  const handlePurchase = (upgradeId: string) => {
    purchaseUpgrade(upgradeId);
  };
  
  if (availableUpgrades.length === 0) {
    return (
      <Card className="border-slate-700">
        <CardHeader>
          <CardTitle>🔒 No Upgrades Available Yet</CardTitle>
          <CardDescription>
            Keep playing to unlock new upgrades! Earn revenue, make sales, and maintain high CSI to unlock powerful improvements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <p className="text-4xl mb-4">🚗</p>
            <p className="text-lg">Sell cars and grow your dealership!</p>
            <p className="text-sm mt-2">Your first upgrade will unlock at $15,000 revenue.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-slate-900/30">
        <CardHeader>
          <CardTitle>💎 Upgrade Shop</CardTitle>
          <CardDescription>
            Purchase upgrades to expand your dealership and unlock automation.
            <span className="block mt-2 text-green-400 font-mono">
              Cash Available: ${state.cash.toLocaleString()}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
      
      {Object.entries(upgradesByCategory).map(([category, upgrades]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
            <span>{categoryIcons[category as keyof typeof categoryIcons]}</span>
            <span>{category} Upgrades</span>
            <Badge className={categoryColors[category as keyof typeof categoryColors]}>
              {upgrades.filter(u => !u.purchased).length} available
            </Badge>
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {upgrades.map((upgrade) => (
              <UpgradeCard
                key={upgrade.id}
                upgrade={upgrade}
                canAfford={state.cash >= upgrade.cost}
                onPurchase={() => handlePurchase(upgrade.id)}
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* Summary */}
      <Card className="border-slate-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {availableUpgrades.filter(u => !u.purchased).length}
              </p>
              <p className="text-xs text-slate-400">Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">
                {availableUpgrades.filter(u => u.purchased).length}
              </p>
              <p className="text-xs text-slate-400">Purchased</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {state.purchasedUpgrades?.length || 0}
              </p>
              <p className="text-xs text-slate-400">Total Owned</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradeShop;





