import { GameState, MonthlyReport } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { safeGet } from '../../lib/api';
import { useState } from 'react';

interface Props {
  state: GameState;
}

const ReportsView = ({ state }: Props) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const data = await safeGet<{ month: string; daily: GameState['dailyHistory'] }>('/api/reports/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${data.month}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>High-level performance across sales, service, and customer experience.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-slate-200">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2">Month</th>
                <th>Units</th>
                <th>Total Gross</th>
                <th>Avg Front</th>
                <th>Avg Back</th>
                <th>Fixed Coverage</th>
                <th>CSI</th>
              </tr>
            </thead>
            <tbody>
              {state.monthlyReports.map((report) => (
                <tr key={report.month} className="border-t border-slate-800/70">
                  <td className="py-2">{report.month}</td>
                  <td>{report.salesUnits}</td>
                  <td>${Math.round(report.totalGross).toLocaleString()}</td>
                  <td>${Math.round(report.avgFrontGross).toLocaleString()}</td>
                  <td>${Math.round(report.avgBackGross).toLocaleString()}</td>
                  <td>{(report.fixedCoverage * 100).toFixed(0)}%</td>
                  <td>{report.csi.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Button onClick={handleExport} disabled={exporting}>
        {exporting ? 'Preparing export...' : 'Export Current Month JSON'}
      </Button>
    </div>
  );
};

export default ReportsView;
