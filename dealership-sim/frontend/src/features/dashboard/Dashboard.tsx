import { GameState, OPERATING_EXPENSES } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
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

  const latestReport = state.dailyHistory[state.dailyHistory.length - 1];
  const currentDate = `${state.year}-${String(state.month).padStart(2, '0')}-${String(state.day).padStart(2, '0')}`;
  
  // Calculate MTD and projections
  const currentMonthKey = `${state.year}-${String(state.month).padStart(2, '0')}`;
  const mtdReports = state.dailyHistory.filter(report => report.date.startsWith(currentMonthKey));
  const mtdUnits = mtdReports.reduce((sum, report) => sum + report.salesUnits, 0);
  const mtdRevenue = mtdReports.reduce((sum, report) => sum + report.totalGross, 0);
  const daysElapsed = state.day;
  const daysRemaining = 30 - state.day;
  const dailyAvgUnits = daysElapsed > 0 ? mtdUnits / daysElapsed : 0;
  const dailyAvgRevenue = daysElapsed > 0 ? mtdRevenue / daysElapsed : 0;
  const projectedUnits = Math.round(mtdUnits + (dailyAvgUnits * daysRemaining));
  const projectedRevenue = Math.round(mtdRevenue + (dailyAvgRevenue * daysRemaining));
  
  // Calculate operating expense breakdown
  const activeAdvisors = state.advisors.filter(a => a.active).length;
  const activeTechs = state.technicians.filter(t => t.active).length;
  const inventorySlots = state.inventory.filter(v => v.status === 'inStock').length;
  const salariesDaily = (activeAdvisors * OPERATING_EXPENSES.advisorSalaryPerDay) + 
                        (activeTechs * OPERATING_EXPENSES.technicianSalaryPerDay) +
                        (state.salesManager ? OPERATING_EXPENSES.salesManagerSalaryPerDay : 0);
  const facilityCostsDaily = OPERATING_EXPENSES.facilityBaseCost + 
                             (inventorySlots * OPERATING_EXPENSES.facilityPerSlot);
  const overheadDaily = OPERATING_EXPENSES.overheadBase;
  
  // Calculate floor plan interest
  const inStockVehicles = state.inventory.filter(v => v.status === 'inStock');
  const totalFloorValue = inStockVehicles.reduce((sum, vehicle) => sum + vehicle.floor, 0);
  const floorPlanInterestDaily = totalFloorValue * OPERATING_EXPENSES.floorPlanInterestRate;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/30 to-slate-900/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Month-to-Date Performance</span>
            <span className="text-purple-400 font-mono">Day {state.day} of 30</span>
          </CardTitle>
          <CardDescription>Current pace and month-end projection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Units Sold MTD</p>
                <p className="text-3xl font-bold text-green-400">{mtdUnits}</p>
                <p className="text-xs text-slate-500">Avg: {dailyAvgUnits.toFixed(1)}/day</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Revenue MTD</p>
                <p className="text-2xl font-bold text-green-400">${Math.round(mtdRevenue).toLocaleString()}</p>
                <p className="text-xs text-slate-500">Avg: ${Math.round(dailyAvgRevenue).toLocaleString()}/day</p>
              </div>
            </div>
            <div className="space-y-4 border-l border-slate-700 pl-6">
              <div>
                <p className="text-xs text-slate-400 mb-1">Projected Month-End Units</p>
                <p className="text-3xl font-bold text-blue-400">{projectedUnits}</p>
                <p className="text-xs text-slate-500">+{Math.round(dailyAvgUnits * daysRemaining)} more in {daysRemaining} days</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Projected Month-End Revenue</p>
                <p className="text-2xl font-bold text-blue-400">${projectedRevenue.toLocaleString()}</p>
                <p className="text-xs text-slate-500">+${Math.round(dailyAvgRevenue * daysRemaining).toLocaleString()} more in {daysRemaining} days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-slate-900/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today&apos;s Performance</span>
            <span className="text-blue-400 font-mono">{currentDate}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4 text-center">
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Units Sold Today</p>
            <p className="mt-2 text-3xl font-bold text-green-400">{latestReport?.salesUnits ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Total Gross Today</p>
            <p className="mt-2 text-2xl font-bold text-green-400">${Math.round(latestReport?.totalGross ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Closing Rate</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">{((latestReport?.closingRate ?? 0) * 100).toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Service Hours</p>
            <p className="mt-2 text-3xl font-bold text-cyan-400">{Math.round(latestReport?.serviceLaborHours ?? 0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/30 bg-gradient-to-r from-red-950/20 to-slate-900/30">
        <CardHeader>
          <CardTitle>Daily Operating Expenses</CardTitle>
          <CardDescription>Fixed costs deducted every day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
            <span className="text-slate-400">Staff Salaries:</span>
            <span className="font-mono text-red-400">-${salariesDaily.toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-500 pl-4 space-y-1">
            <div className="flex justify-between">
              <span>• {activeAdvisors} Advisor{activeAdvisors !== 1 ? 's' : ''} @ ${OPERATING_EXPENSES.advisorSalaryPerDay}/day</span>
              <span className="font-mono">${(activeAdvisors * OPERATING_EXPENSES.advisorSalaryPerDay).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>• {activeTechs} Technician{activeTechs !== 1 ? 's' : ''} @ ${OPERATING_EXPENSES.technicianSalaryPerDay}/day</span>
              <span className="font-mono">${(activeTechs * OPERATING_EXPENSES.technicianSalaryPerDay).toLocaleString()}</span>
            </div>
            {state.salesManager && (
              <div className="flex justify-between">
                <span>• Sales Manager @ ${OPERATING_EXPENSES.salesManagerSalaryPerDay}/day</span>
                <span className="font-mono">${OPERATING_EXPENSES.salesManagerSalaryPerDay.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
            <span className="text-slate-400">Facility Costs:</span>
            <span className="font-mono text-red-400">-${facilityCostsDaily.toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-500 pl-4 space-y-1">
            <div className="flex justify-between">
              <span>• Base facility (utilities, insurance)</span>
              <span className="font-mono">${OPERATING_EXPENSES.facilityBaseCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>• {inventorySlots} Inventory slots @ ${OPERATING_EXPENSES.facilityPerSlot}/day</span>
              <span className="font-mono">${(inventorySlots * OPERATING_EXPENSES.facilityPerSlot).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
            <span className="text-slate-400">General Overhead:</span>
            <span className="font-mono text-red-400">-${overheadDaily.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
            <span className="text-slate-400">Floor Plan Interest:</span>
            <span className="font-mono text-red-400">-${Math.round(floorPlanInterestDaily).toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-500 pl-4 space-y-1">
            <div className="flex justify-between">
              <span>• ${Math.round(totalFloorValue).toLocaleString()} financed @ {(OPERATING_EXPENSES.floorPlanInterestRate * 365 * 100).toFixed(1)}% APR</span>
              <span className="font-mono">${Math.round(floorPlanInterestDaily).toLocaleString()}/day</span>
            </div>
            <div className="text-xs text-amber-400 mt-1">
              ⚠️ Holding {inventorySlots} vehicles costs you daily!
            </div>
          </div>
          
          <div className="flex justify-between text-base font-semibold pt-2 border-t-2 border-slate-600">
            <span>Total Daily Expenses:</span>
            <span className="font-mono text-red-500">-${Math.round((latestReport?.operatingExpenses ?? 0) + (latestReport?.floorPlanInterest ?? 0)).toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-500 text-right">
            (~${Math.round(((latestReport?.operatingExpenses ?? 0) + (latestReport?.floorPlanInterest ?? 0)) * 30).toLocaleString()}/month)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow (Last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{ background: '#0f172a', borderColor: '#1e293b' }} 
              />
              <Area type="monotone" dataKey="cash" stroke="#10b981" fill="#059669" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Today&apos;s Activity</CardTitle>
          <CardDescription>Real-time leads, appointments, and sales activity</CardDescription>
        </CardHeader>
        <CardContent className="h-64 overflow-y-auto">
          <div className="space-y-2">
            {(state.leadActivity || []).slice(0, 15).map((activity, index) => {
              const isRecent = index < 5; // Highlight last 5 activities
              
              const getActivityColor = () => {
                switch (activity.outcome) {
                  case 'sale': return 'border-green-500/30 bg-green-950/20';
                  case 'appointment': return 'border-yellow-500/30 bg-yellow-950/20';
                  case 'lead': return 'border-blue-500/30 bg-blue-950/20';
                  case 'no_show': return 'border-red-500/30 bg-red-950/20';
                  default: return 'border-slate-700 bg-slate-900/50';
                }
              };
              
              const getDotColor = () => {
                switch (activity.outcome) {
                  case 'sale': return 'bg-green-500';
                  case 'appointment': return 'bg-yellow-500';
                  case 'lead': return 'bg-blue-500';
                  case 'no_show': return 'bg-red-500';
                  default: return 'bg-slate-500';
                }
              };
              
              const getActivityText = () => {
                switch (activity.outcome) {
                  case 'sale':
                    return `${activity.advisorName} sold ${activity.vehicleInfo}`;
                  case 'appointment':
                    return `${activity.advisorName} set appointment with ${activity.customerType}`;
                  case 'lead':
                    return `New ${activity.customerType} lead came in`;
                  case 'no_show':
                    return `${activity.advisorName} - ${activity.customerType} no-show`;
                  default:
                    return 'Unknown activity';
                }
              };
              
              return (
                <div 
                  key={activity.id} 
                  className={`p-2 rounded-lg border ${getActivityColor()}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getDotColor()} ${isRecent ? 'animate-pulse' : ''}`} />
                      <div>
                        <p className="text-xs font-medium">
                          {getActivityText()}
                        </p>
                        {activity.gross && (
                          <p className="text-xs text-green-400">
                            +${activity.gross.toLocaleString()} gross
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show current pipeline activity */}
            <div className="border-t border-slate-700 pt-3 mt-4">
              <p className="text-xs text-slate-400 mb-2">Current Pipeline:</p>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="p-2 rounded bg-blue-950/30 border border-blue-500/30">
                  <p className="text-blue-400 font-semibold">{state.pipeline.leads}</p>
                  <p className="text-xs text-slate-400">New Leads</p>
                </div>
                <div className="p-2 rounded bg-yellow-950/30 border border-yellow-500/30">
                  <p className="text-yellow-400 font-semibold">{state.pipeline.appointments}</p>
                  <p className="text-xs text-slate-400">Appointments</p>
                </div>
                <div className="p-2 rounded bg-purple-950/30 border border-purple-500/30">
                  <p className="text-purple-400 font-semibold">{state.pipeline.deals}</p>
                  <p className="text-xs text-slate-400">Active Deals</p>
                </div>
              </div>
            </div>
            
            {(state.leadActivity || []).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p>No activity today yet.</p>
                <p className="text-xs">Watch for leads, appointments, and sales!</p>
              </div>
            )}
          </div>
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
