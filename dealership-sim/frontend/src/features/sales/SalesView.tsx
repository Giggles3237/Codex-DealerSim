import { GameState } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface Props {
  state: GameState;
}

const moraleColor = (morale: number) => {
  if (morale > 80) return 'success';
  if (morale > 60) return 'default';
  if (morale > 40) return 'warning';
  return 'danger';
};

const SalesView = ({ state }: Props) => {
  const latest = state.dailyHistory[state.dailyHistory.length - 1];
  
  // Real-time today's totals
  const todayUnits = (state.todayDeals || []).length;
  const todayLeads = state.todayLeadsGenerated || 0;
  const todayAppointments = state.todayAppointments || 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Funnel</CardTitle>
          <CardDescription>Leads flow from marketing to sold deals.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 text-center text-slate-200">
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-400">Leads</p>
            <p className="mt-2 text-3xl font-bold">{todayLeads}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-400">Appointments</p>
            <p className="mt-2 text-3xl font-bold">{todayAppointments}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-400">Deals</p>
            <p className="mt-2 text-3xl font-bold">{todayUnits}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advisor Roster</CardTitle>
          <CardDescription>Morale directly influences close rates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.advisors.map((advisor) => (
            <div key={advisor.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div>
                <p className="font-semibold text-foreground">{advisor.name}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">{advisor.archetype}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={moraleColor(advisor.morale)}>Morale {Math.round(advisor.morale)}</Badge>
                <p className="text-sm text-slate-300">Close {Math.round(advisor.skill.close)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Deals</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm text-slate-200">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2">Date</th>
                <th>Advisor</th>
                <th>Vehicle</th>
                <th>Sold Price</th>
                <th>Front</th>
                <th>Back</th>
                <th>CSI Impact</th>
              </tr>
            </thead>
            <tbody>
              {state.recentDeals.slice(0, 10).map((deal) => {
                const vehicle = state.inventory.find((item) => item.id === deal.vehicleId);
                const advisor = state.advisors.find((item) => item.id === deal.advisorId);
                return (
                  <tr key={deal.id} className="border-t border-slate-800/70">
                    <td className="py-2">{deal.date.slice(0, 10)}</td>
                    <td>{advisor?.name ?? 'Unknown'}</td>
                    <td>
                      {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : deal.vehicleId}
                    </td>
                    <td>${Math.round(deal.soldPrice).toLocaleString()}</td>
                    <td>${Math.round(deal.frontGross).toLocaleString()}</td>
                    <td>${Math.round(deal.backGross).toLocaleString()}</td>
                    <td>{deal.csiImpact.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesView;
