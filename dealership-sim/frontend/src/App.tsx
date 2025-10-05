import { useEffect, useMemo } from 'react';
import { Loader2, Pause, Play, AlertTriangle } from 'lucide-react';
import { useGameStore } from './state/useGameStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription } from './components/ui/toast';
import Dashboard from './features/dashboard/Dashboard';
import ControlPanel from './features/control-panel/ControlPanel';
import InventoryView from './features/inventory/InventoryView';
import SalesView from './features/sales/SalesView';
import ServiceView from './features/service/ServiceView';
import ReportsView from './features/reports/ReportsView';

const App = () => {
  const {
    gameState,
    initialize,
    loading,
    error,
    tick,
    setPaused,
    setSpeed,
    toasts,
    dismissToast,
    health,
  } = useGameStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const kpis = useMemo(() => {
    if (!gameState) return [];
    const soldMTD = gameState.dailyHistory
      .filter((report) => report.date.includes(`${gameState.year}-${String(gameState.month).padStart(2, '0')}`))
      .reduce((acc, report) => acc + report.salesUnits, 0);
    const grossMTD = gameState.dailyHistory
      .filter((report) => report.date.includes(`${gameState.year}-${String(gameState.month).padStart(2, '0')}`))
      .reduce((acc, report) => acc + report.totalGross, 0);
    return [
      { label: 'Cash', value: `$${gameState.cash.toLocaleString()}` },
      { label: 'Units In Stock', value: gameState.inventory.filter((vehicle) => vehicle.status === 'inStock').length },
      { label: 'Units Sold (MTD)', value: soldMTD },
      { label: 'Gross (MTD)', value: `$${Math.round(grossMTD).toLocaleString()}` },
      { label: 'Service Hours', value: Math.round(gameState.dailyHistory[gameState.dailyHistory.length - 1]?.serviceLaborHours ?? 0) },
      { label: 'CSI', value: Math.round(gameState.csi) },
    ];
  }, [gameState]);

  if (loading || !gameState) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        {error ? (
          <div className="text-center">
            <p className="text-xl font-semibold">{error}</p>
            <Button className="mt-4" onClick={() => initialize()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Preparing showroom...
          </div>
        )}
      </div>
    );
  }

  const isPaused = gameState.paused;

  return (
    <ToastProvider swipeDirection="right">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 text-foreground">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dealership Simulator</h1>
              <p className="text-sm text-slate-400">
                Day {gameState.day} · {new Date().toLocaleDateString(undefined, { month: 'long' })} {gameState.year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => tick(1)}>
                Step Day
              </Button>
              <Button variant="outline" onClick={() => setSpeed(1)} className={gameState.speed === 1 ? 'border-primary text-primary' : ''}>
                1x
              </Button>
              <Button variant="outline" onClick={() => setSpeed(5)} className={gameState.speed === 5 ? 'border-primary text-primary' : ''}>
                5x
              </Button>
              <Button variant="outline" onClick={() => setSpeed(30)} className={gameState.speed === 30 ? 'border-primary text-primary' : ''}>
                30x
              </Button>
              <Button variant="outline" onClick={() => setPaused(!isPaused)}>
                {isPaused ? (
                  <span className="flex items-center gap-2"><Play className="h-4 w-4" /> Resume</span>
                ) : (
                  <span className="flex items-center gap-2"><Pause className="h-4 w-4" /> Pause</span>
                )}
              </Button>
            </div>
          </div>
          {health?.starving && (
            <div className="border-t border-amber-500/30 bg-amber-500/10 py-2 text-center text-sm text-amber-200">
              <AlertTriangle className="mr-2 inline h-4 w-4" /> {health.message}
            </div>
          )}
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow">
                <p className="text-xs uppercase tracking-wide text-slate-400">{kpi.label}</p>
                <p className="mt-2 text-xl font-semibold">{kpi.value}</p>
              </div>
            ))}
          </section>

          <Tabs defaultValue="dashboard" className="mt-8">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="control">Control Panel</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <Dashboard state={gameState} />
            </TabsContent>
            <TabsContent value="control">
              <ControlPanel state={gameState} health={health} />
            </TabsContent>
            <TabsContent value="inventory">
              <InventoryView state={gameState} />
            </TabsContent>
            <TabsContent value="sales">
              <SalesView state={gameState} />
            </TabsContent>
            <TabsContent value="service">
              <ServiceView state={gameState} />
            </TabsContent>
            <TabsContent value="reports">
              <ReportsView state={gameState} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <ToastViewport className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2" />
      {toasts.map((toast) => (
        <Toast key={toast.id} open onOpenChange={(open) => !open && dismissToast(toast.id)}>
          <div className="flex flex-col">
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </div>
        </Toast>
      ))}
    </ToastProvider>
  );
};

export default App;
