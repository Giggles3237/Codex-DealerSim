import { useState, ChangeEvent } from 'react';
import { GameState, HealthCheckResult, CONFIG_PRESETS } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { useGameStore } from '../../state/useGameStore';

interface Props {
  state: GameState;
  health: HealthCheckResult | null;
}

const ControlPanel = ({ state, health }: Props) => {
  const { updateCoefficients, applyPreset, updateMarketing, resetGame, setSalesGoal } = useGameStore();
  const [salesGoalInput, setSalesGoalInput] = useState(state.salesGoal?.toString() || '120');

  // Function to detect which preset is currently active
  const getActivePreset = () => {
    for (const preset of CONFIG_PRESETS) {
      if (preset.id === 'balanced') {
        // For balanced preset, check if coefficients match defaults (no overrides)
        const hasOverrides = Object.keys(preset.coefficients).length === 0;
        if (hasOverrides) {
          // Check if current state matches default coefficients
          const isDefault = 
            state.coefficients.lead.basePerDay === 10 &&
            state.coefficients.lead.marketingK === 0.10 &&
            state.coefficients.sales.baseClose === 0.10 &&
            state.coefficients.pricing.variancePct === 0.035 &&
            state.coefficients.inventory.minDaysSupply === 35 &&
            state.coefficients.finance.avgBackGross === 950 &&
            state.coefficients.finance.backGrossProb === 0.62;
          if (isDefault) return preset.id;
        }
      } else {
        // For other presets, check if current coefficients match preset values
        let matches = true;
        for (const [group, values] of Object.entries(preset.coefficients)) {
          for (const [key, value] of Object.entries(values)) {
            if (state.coefficients[group as keyof typeof state.coefficients][key] !== value) {
              matches = false;
              break;
            }
          }
          if (!matches) break;
        }
        if (matches) return preset.id;
      }
    }
    return null;
  };

  const handleChange = (group: keyof GameState['coefficients'], key: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    updateCoefficients({ [group]: { [key]: value } } as any);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to start over? This will reset the game to its initial state and cannot be undone.')) {
      resetGame();
    }
  };

  const handleSalesGoalUpdate = () => {
    const goal = parseInt(salesGoalInput);
    if (goal > 0 && goal <= 2000) {
      setSalesGoal(goal);
    }
  };

  const handleSalesGoalKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSalesGoalUpdate();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
          <CardDescription>Select a balancing preset to quickly tune the store.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {CONFIG_PRESETS.map((preset) => {
            const isActive = getActivePreset() === preset.id;
            
            return (
              <Button 
                key={preset.id} 
                variant={isActive ? "default" : "outline"} 
                onClick={() => applyPreset(preset.id)}
                className={`w-20 h-10 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg scale-105 ring-2 ring-blue-400' 
                    : 'hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {preset.name}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Game Controls</CardTitle>
          <CardDescription>Reset the game or manage save states.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="destructive" onClick={handleReset}>
            Start Over
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Goals</CardTitle>
          <CardDescription>Set your annual sales target (SPG)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sales-goal">Annual Sales Goal (SPG)</Label>
            <div className="flex gap-2">
              <Input
                id="sales-goal"
                type="number"
                value={salesGoalInput}
                onChange={(e) => setSalesGoalInput(e.target.value)}
                onKeyPress={handleSalesGoalKeyPress}
                placeholder="120"
                min="1"
                max="2000"
                className="flex-1"
              />
              <Button onClick={handleSalesGoalUpdate} variant="outline">
                Update
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Current: {state.salesGoal || 120} cars/year • Monthly target: {Math.round((state.salesGoal || 120) / 12)} cars
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded bg-blue-950/30 border border-blue-500/30">
              <p className="text-blue-400 font-semibold">
                {state.lifetimeSales || 0}
              </p>
              <p className="text-xs text-slate-400">Lifetime Sales</p>
            </div>
            <div className="p-3 rounded bg-green-950/30 border border-green-500/30">
              <p className="text-green-400 font-semibold">
                {Math.round(((state.lifetimeSales || 0) / (state.salesGoal || 120)) * 100)}%
              </p>
              <p className="text-xs text-slate-400">Goal Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Health Check</CardTitle>
          <CardDescription>
            Current coefficients support sustainable inventory replacement.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Marketing & Lead Generation</CardTitle>
          <CardDescription>Adjust spend and demand coefficients.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <label className="text-sm">
            Spend / Day
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 p-2"
              value={state.marketing.spendPerDay}
              onChange={(event) => updateMarketing(Number(event.target.value))}
            />
          </label>
          <label className="text-sm">
            Base Per Day
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 p-2"
              value={state.coefficients.lead.basePerDay}
              onChange={handleChange('lead', 'basePerDay')}
            />
          </label>
          <label className="text-sm">
            Marketing K
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 p-2"
              value={state.coefficients.lead.marketingK}
              onChange={handleChange('lead', 'marketingK')}
            />
          </label>
          <label className="text-sm">
            Diminishing K
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 p-2"
              value={state.coefficients.lead.diminishingK}
              onChange={handleChange('lead', 'diminishingK')}
            />
          </label>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales Tuning</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {Object.entries(state.coefficients.sales).map(([key, value]) => (
            <label key={key} className="text-sm capitalize">
              {key}
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 p-2"
                value={Number(value.toFixed ? value.toFixed(2) : value)}
                onChange={handleChange('sales', key)}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Inventory & Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {Object.entries(state.coefficients.inventory).map(([key, value]) => (
            <label key={key} className="text-sm capitalize">
              {key}
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 p-2"
                value={value}
                onChange={handleChange('inventory', key)}
              />
            </label>
          ))}
          {Object.entries(state.coefficients.pricing).map(([key, value]) => (
            <label key={key} className="text-sm capitalize">
              {key}
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 p-2"
                value={value}
                onChange={handleChange('pricing', key)}
              />
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlPanel;
