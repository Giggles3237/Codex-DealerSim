import { GameState } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

interface Props {
  state: GameState;
}

const Dashboard = ({ state }: Props) => {
  const cashSeries = state.dailyHistory.slice(-30).map((report) => ({ date: report.date.slice(-5), cash: report.cash }));
  const salesSeries = state.dailyHistory.slice(-30).map((report) => ({ date: report.date.slice(-5), units: report.salesUnits }));
  const serviceSeries = state.dailyHistory.slice(-30).map((report) => ({
    date: report.date.slice(-5),
    labor: report.serviceLaborHours,
    parts: report.servicePartsRevenue,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Cash Balance</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashSeries}>
              <defs>
                <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b' }} />
              <Area type="monotone" dataKey="cash" stroke="#38bdf8" fillOpacity={1} fill="url(#cashGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Units Sold (Last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b' }} />
              <Bar dataKey="units" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Mix</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviceSeries} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => `${Math.round(value * 100)}%`} />
              <Tooltip
                formatter={(value: number) => `${Math.round(value)} hrs`}
                contentStyle={{ background: '#0f172a', borderColor: '#1e293b' }}
              />
              <Legend />
              <Bar dataKey="labor" stackId="a" fill="#22d3ee" name="Labor Hours" />
              <Bar dataKey="parts" stackId="a" fill="#38bdf8" name="Parts Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
