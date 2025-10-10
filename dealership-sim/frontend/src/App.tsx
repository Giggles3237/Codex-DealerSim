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
import BusinessView from './features/business/BusinessView';

const App = () => {
  const {
    gameState,
    initialize,
    refreshState,
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

  // Auto-refresh game state while game is running
  useEffect(() => {
    if (!gameState || gameState.paused) return;

    const interval = setInterval(() => {
      refreshState();
    }, 1000); // Refresh every 1 second

    return () => clearInterval(interval);
  }, [gameState, gameState?.paused, refreshState]);

  const kpis = useMemo(() => {
    if (!gameState) return [];
    const soldMTD = gameState.dailyHistory
      .filter((report) => report.date.includes(`${gameState.year}-${String(gameState.month).padStart(2, '0')}`))
      .reduce((acc, report) => acc + report.salesUnits, 0);
    const grossMTD = gameState.dailyHistory
      .filter((report) => report.date.includes(`${gameState.year}-${String(gameState.month).padStart(2, '0')}`))
      .reduce((acc, report) => acc + report.totalGross, 0);
    return [
      { label: 'Business Level', value: `L${gameState.businessLevel || 1}` },
      { label: 'Cash', value: `$${Math.round(gameState.cash).toLocaleString()}` },
      { label: 'Units In Stock', value: gameState.inventory.filter((vehicle) => vehicle.status === 'inStock').length },
      { label: 'Units Sold (MTD)', value: soldMTD },
      { label: 'Annual Goal', value: `${gameState.salesGoal || 120} cars` },
      { label: 'Progress', value: `${Math.round(((gameState.lifetimeSales || 0) / (gameState.salesGoal || 120)) * 100)}%` },
    ];
  }, [gameState]);

  if (loading || !gameState) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        {error ? (
          <div className="text-center">
            <p className="text-xl font-semibold text-red-400">{error}</p>
            <p className="text-sm text-slate-400 mt-2">Check console for details</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 text-foreground relative">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dealership Simulator</h1>
              <p className="text-lg font-semibold text-blue-400">
                {new Date(gameState.year, gameState.month - 1).toLocaleDateString(undefined, { month: 'long' })} {gameState.day}, {gameState.year}
                <span className="ml-3 text-cyan-400">
                  {gameState.hour === 12 ? '12:00 PM' : gameState.hour > 12 ? `${gameState.hour - 12}:00 PM` : gameState.hour === 0 ? '12:00 AM' : `${gameState.hour}:00 AM`}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={gameState.hour === 21 && gameState.paused ? "default" : "outline"}
                onClick={() => tick(1)}
                className={gameState.hour === 21 && gameState.paused ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' : ''}
              >
                {gameState.hour === 21 && gameState.paused ? '✓ Close Out Day' : 'Close Out Day'}
              </Button>
              {true ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setSpeed(1)} 
                    className={gameState.speed === 1 ? 'border-primary text-primary' : ''}
                    disabled={!gameState.salesManager}
                  >
                    1x (2s/hr)
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSpeed(5)} 
                    className={gameState.speed === 5 ? 'border-primary text-primary' : ''}
                    disabled={!gameState.salesManager}
                  >
                    5x (0.4s/hr)
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSpeed(30)} 
                    className={gameState.speed === 30 ? 'border-primary text-primary' : ''}
                    disabled={!gameState.salesManager}
                  >
                    Fast (0.067s/hr)
                  </Button>
                  <Button 
                    variant={isPaused ? "outline" : "default"} 
                    onClick={() => setPaused(!isPaused)}
                    className={!isPaused ? 'bg-green-600 hover:bg-green-700' : ''}
                    disabled={gameState.hour === 21}
                  >
                    {isPaused ? (
                      <span className="flex items-center gap-2"><Play className="h-4 w-4" /> Resume</span>
                    ) : (
                      <span className="flex items-center gap-2"><Pause className="h-4 w-4" /> Pause</span>
                    )}
                  </Button>
                </>
              ) : null}
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
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="control">Control Panel</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <Dashboard state={gameState} />
            </TabsContent>
            <TabsContent value="business">
              <BusinessView state={gameState} />
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
      {toasts.map((toast) => {
        const isDailySummary = toast.description.includes('📊 Day') && toast.description.includes('Summary:');
        
        if (isDailySummary) {
          return (
            <div key={toast.id} className="fixed inset-0 z-[100000] flex items-center justify-center" style={{ zIndex: 100000 }}>
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/80"
                onClick={() => dismissToast(toast.id)}
              />
              {/* Modal */}
              <div className="relative z-10 max-w-2xl w-[90vw] rounded-xl border-2 border-blue-500/50 bg-slate-800 shadow-2xl p-6">
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-blue-400">{toast.title}</h3>
                    <button
                      type="button"
                      onClick={() => dismissToast(toast.id)}
                      className="text-slate-400 hover:text-slate-200 text-xl font-bold px-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-base whitespace-pre-line font-mono leading-relaxed text-slate-200">
                    {toast.description}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <Toast key={toast.id} open duration={5000} onOpenChange={(open) => !open && dismissToast(toast.id)}>
            <div className="flex flex-col">
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastDescription>{toast.description}</ToastDescription>
            </div>
          </Toast>
        );
      })}
    </ToastProvider>
  );
};

export default App;
