import { ChangeEvent } from 'react';
import { GameState, HealthCheckResult, CONFIG_PRESETS } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useGameStore } from '../../state/useGameStore';

interface Props {
  state: GameState;
  health: HealthCheckResult | null;
}

const ControlPanel = ({ state, health }: Props) => {
  const { updateCoefficients, applyPreset, updateMarketing } = useGameStore();

  const handleChange = (group: keyof GameState['coefficients'], key: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    updateCoefficients({ [group]: { [key]: value } } as any);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
          <CardDescription>Select a balancing preset to quickly tune the store.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {CONFIG_PRESETS.map((preset) => (
            <Button key={preset.id} variant="outline" onClick={() => applyPreset(preset.id)}>
              {preset.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Health Check</CardTitle>
          <CardDescription>
            {health?.starving
              ? `Warning: Expected gross ${Math.round(health.expectedGross)} vs replacement ${Math.round(health.replacementGross)}`
              : 'Current coefficients support sustainable inventory replacement.'}
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
