import { GameState, BUSINESS_LEVELS, OPERATING_EXPENSES } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useGameStore } from '../../state/useGameStore';

interface Props {
  state: GameState;
}

const BusinessView = ({ state }: Props) => {
  const { upgradeBusiness, hireManager } = useGameStore();
  const currentLevel = BUSINESS_LEVELS.find(level => level.level === (state.businessLevel || 1)) || BUSINESS_LEVELS[0];
  const nextLevel = BUSINESS_LEVELS.find(level => level.level === (state.businessLevel || 1) + 1);

  const canUpgrade = () => {
    if (!nextLevel) return false;
    if (nextLevel.unlockCost && state.cash < nextLevel.unlockCost) return false;
    
    // Check requirements
    if (nextLevel.unlockRequirement) {
    if (nextLevel.unlockRequirement.includes('$50,000 total revenue') && (state.totalRevenue || 0) < 50000) return false;
    if (nextLevel.unlockRequirement.includes('Sell 100 vehicles') && (state.lifetimeSales || 0) < 100) return false;
    if (nextLevel.unlockRequirement.includes('95+ CSI rating') && state.csi < 95) return false;
    if (nextLevel.unlockRequirement.includes('$1M total revenue') && (state.totalRevenue || 0) < 1000000) return false;
    }
    
    return true;
  };

  const getProgressPercent = (requirement: string) => {
    if (requirement.includes('$50,000 total revenue')) {
      return Math.min(100, ((state.totalRevenue || 0) / 50000) * 100);
    }
    if (requirement.includes('Sell 100 vehicles')) {
      return Math.min(100, ((state.lifetimeSales || 0) / 100) * 100);
    }
    if (requirement.includes('95+ CSI rating')) {
      return Math.min(100, (state.csi / 95) * 100);
    }
    if (requirement.includes('$1M total revenue')) {
      return Math.min(100, ((state.totalRevenue || 0) / 1000000) * 100);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {!state.salesManager && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-slate-900/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🎯 Hire a Sales Manager</span>
              <Badge variant="default" className="bg-amber-600 text-lg px-4 py-2">
                Unlock Auto-Advance
              </Badge>
            </CardTitle>
            <CardDescription>
              Hiring a Sales Manager enables auto-advance functionality, allowing the game to run automatically 
              without clicking "Advance 1 Day" manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/70">
                <p className="text-xs text-slate-400">One-time Cost</p>
                <p className="mt-1 text-2xl font-bold text-amber-400">${OPERATING_EXPENSES.salesManagerHireCost.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/70">
                <p className="text-xs text-slate-400">Daily Salary</p>
                <p className="mt-1 text-2xl font-bold text-red-400">${OPERATING_EXPENSES.salesManagerSalaryPerDay.toLocaleString()}/day</p>
                <p className="text-xs text-slate-500 mt-1">(~${(OPERATING_EXPENSES.salesManagerSalaryPerDay * 365).toLocaleString()}/year)</p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30">
              <p className="text-sm text-blue-300">✨ Benefits:</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300 list-disc list-inside">
                <li>Boost productivity and unlock management features</li>
                <li>Higher closing rates and better gross profit</li>
                <li>Professional leadership for your team</li>
              </ul>
            </div>
            
            <Button 
              onClick={hireManager}
              disabled={state.cash < OPERATING_EXPENSES.salesManagerHireCost}
              className="w-full"
              variant={state.cash >= OPERATING_EXPENSES.salesManagerHireCost ? "default" : "outline"}
            >
              {state.cash >= OPERATING_EXPENSES.salesManagerHireCost 
                ? `Hire Sales Manager ($${OPERATING_EXPENSES.salesManagerHireCost.toLocaleString()})` 
                : `Not Enough Cash (Need $${OPERATING_EXPENSES.salesManagerHireCost.toLocaleString()})`}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {state.salesManager && (
        <Card className="border-green-500/30 bg-gradient-to-r from-green-950/30 to-slate-900/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>✅ Sales Manager</span>
              <Badge variant="default" className="bg-green-600 text-lg px-4 py-2">
                Active
              </Badge>
            </CardTitle>
            <CardDescription>
              Your Sales Manager enables auto-advance. Hired on {state.salesManager.hiredDate}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/70">
              <p className="text-xs text-slate-400">Daily Salary Cost</p>
              <p className="mt-1 text-xl font-bold text-red-400">-${state.salesManager.salary.toLocaleString()}/day</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-slate-900/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Business Level</span>
            <Badge variant="default" className="text-lg px-4 py-2">
              Level {currentLevel.level} - {currentLevel.name}
            </Badge>
          </CardTitle>
          <CardDescription>{currentLevel.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Capacity</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Max Advisors:</span>
                <span className="font-mono">{state.advisors.length}/{currentLevel.maxAdvisors}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Technicians:</span>
                <span className="font-mono">{state.technicians.length}/{currentLevel.maxTechnicians}</span>
              </div>
              <div className="flex justify-between">
                <span>Inventory Slots:</span>
                <span className="font-mono">{state.inventory.filter(v => v.status === 'inStock').length}/{currentLevel.maxInventorySlots}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Bays:</span>
                <span className="font-mono">{currentLevel.serviceBayCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Marketing Budget:</span>
                <span className="font-mono">${currentLevel.marketingBudget}/day</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Progress Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-mono">${(state.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Lifetime Sales:</span>
                <span className="font-mono">{state.lifetimeSales || 0} vehicles</span>
              </div>
              <div className="flex justify-between">
                <span>CSI Rating:</span>
                <span className="font-mono">{state.csi.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {nextLevel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Next Level: {nextLevel.name}</span>
              {canUpgrade() ? (
                <Button onClick={() => upgradeBusiness()} className="bg-green-600 hover:bg-green-700">
                  Upgrade for ${nextLevel.unlockCost?.toLocaleString()}
                </Button>
              ) : (
                <Button disabled variant="outline">
                  Requirements Not Met
                </Button>
              )}
            </CardTitle>
            <CardDescription>{nextLevel.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Unlock Requirements:</h4>
                {nextLevel.unlockCost && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cash Required:</span>
                      <span className={state.cash >= nextLevel.unlockCost ? 'text-green-400' : 'text-red-400'}>
                        ${Math.round(state.cash).toLocaleString()} / ${nextLevel.unlockCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (state.cash / nextLevel.unlockCost) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {nextLevel.unlockRequirement && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{nextLevel.unlockRequirement}:</span>
                      <span className={canUpgrade() ? 'text-green-400' : 'text-red-400'}>
                        {nextLevel.unlockRequirement.includes('$50,000 total revenue') && `${(state.totalRevenue || 0).toLocaleString()} / 50,000`}
                        {nextLevel.unlockRequirement.includes('Sell 100 vehicles') && `${state.lifetimeSales || 0} / 100`}
                        {nextLevel.unlockRequirement.includes('95+ CSI rating') && `${state.csi.toFixed(1)} / 95`}
                        {nextLevel.unlockRequirement.includes('$1M total revenue') && `${(state.totalRevenue || 0).toLocaleString()} / 1,000,000`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${getProgressPercent(nextLevel.unlockRequirement)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">New Capacity:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Max Advisors:</span>
                    <span className="font-mono">{currentLevel.maxAdvisors} → {nextLevel.maxAdvisors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Technicians:</span>
                    <span className="font-mono">{currentLevel.maxTechnicians} → {nextLevel.maxTechnicians}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inventory Slots:</span>
                    <span className="font-mono">{currentLevel.maxInventorySlots} → {nextLevel.maxInventorySlots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Bays:</span>
                    <span className="font-mono">{currentLevel.serviceBayCount} → {nextLevel.serviceBayCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marketing Budget:</span>
                    <span className="font-mono">${currentLevel.marketingBudget} → ${nextLevel.marketingBudget}/day</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!nextLevel && (
        <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-950/30 to-slate-900/30">
          <CardHeader>
            <CardTitle className="text-yellow-400">🏆 Maximum Level Reached!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Congratulations! You've built the ultimate automotive empire. You can continue growing your business with unlimited potential.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessView;
