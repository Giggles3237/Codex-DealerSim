import { GameState } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface Props {
  state: GameState;
}

const ServiceView = ({ state }: Props) => {
  const latest = state.dailyHistory[state.dailyHistory.length - 1];
  const comebackRate = latest?.serviceComebackRate ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Technician Roster</CardTitle>
          <CardDescription>Efficiency drives hours billed; morale keeps comebacks low.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.technicians.map((tech) => (
            <div key={tech.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div>
                <p className="font-semibold text-foreground">{tech.name}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">{tech.archetype}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Badge variant={tech.morale > 70 ? 'success' : tech.morale > 50 ? 'default' : 'warning'}>
                  Morale {Math.round(tech.morale)}
                </Badge>
                <span>Eff {tech.efficiency.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service KPIs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-200">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-slate-400">Labor Hours (Today)</p>
            <p className="mt-2 text-2xl font-bold">{latest?.serviceLaborHours.toFixed(1) ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-slate-400">Parts Revenue (Today)</p>
            <p className="mt-2 text-2xl font-bold">${Math.round(latest?.servicePartsRevenue ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-slate-400">Comeback Rate</p>
            <p className="mt-2 text-2xl font-bold">{(comebackRate * 100).toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Active Repair Orders</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {state.serviceQueue.length === 0 && <p className="text-slate-400">Queue is clear. Great job!</p>}
          {state.serviceQueue.map((ro) => (
            <div key={ro.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
              <p className="font-semibold">RO #{ro.id.split('-').at(-1)}</p>
              <p>Status: {ro.status}</p>
              <p>Labor: {ro.laborHours.toFixed(1)} hrs</p>
              <p>Parts Est.: ${Math.round(ro.partsRevenue).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {state.completedROs.slice(0, 8).map((ro) => (
            <div key={ro.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
              <p className="font-semibold">RO #{ro.id.split('-').at(-1)}</p>
              <p>Tech: {state.technicians.find((tech) => tech.id === ro.techId)?.name ?? 'Team'}</p>
              <p>Hours: {ro.laborHours.toFixed(1)}</p>
              <p>Parts: ${Math.round(ro.partsRevenue).toLocaleString()}</p>
              <p>CSI Impact: {ro.csiImpact.toFixed(1)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceView;
