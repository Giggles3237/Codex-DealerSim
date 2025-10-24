import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pause, Play, AlertTriangle, Building2, Settings, Sparkles } from 'lucide-react';
import { useGameStore } from './state/useGameStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription } from './components/ui/toast';
import Dashboard from './features/dashboard/Dashboard';
import InventoryView from './features/inventory/InventoryView';
import SalesView from './features/sales/SalesView';
import ServiceView from './features/service/ServiceView';
import ReportsView from './features/reports/ReportsView';
import { AchievementsView } from './features/achievements/AchievementsView';
import BusinessLevelModal from './components/BusinessLevelModal';
import ControlPanelModal from './components/ControlPanelModal';
import UpgradeShopModal from './components/UpgradeShopModal';
import { AutoCloseDayModal } from './components/AutoCloseDayModal';
import { DailySummaryModal } from './components/DailySummaryModal';

const App = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [showBusinessLevelModal, setShowBusinessLevelModal] = useState(false);
  const [showControlPanelModal, setShowControlPanelModal] = useState(false);
  const [showUpgradeShopModal, setShowUpgradeShopModal] = useState(false);
  const [showAutoCloseDayModal, setShowAutoCloseDayModal] = useState(false);
  
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

  const handleStartGame = async () => {
    setGameStarted(true);
    await initialize();
    // Auto-unpause so the game starts running
    setTimeout(() => setPaused(false), 500);
  };

  // Auto-refresh game state while game is running
  useEffect(() => {
    if (!gameState || gameState.paused) return;

    const interval = setInterval(() => {
      refreshState();
    }, 1000); // Refresh every 1 second

    return () => clearInterval(interval);
  }, [gameState, gameState?.paused, refreshState]);

  // Auto-close day modal logic
  useEffect(() => {
    if (gameState?.autoCloseDayScheduled && !showAutoCloseDayModal) {
      setShowAutoCloseDayModal(true);
    }
    
    // Auto-dismiss modal when auto-close timer is no longer scheduled
    if (!gameState?.autoCloseDayScheduled && showAutoCloseDayModal) {
      setShowAutoCloseDayModal(false);
    }
  }, [gameState?.autoCloseDayScheduled, showAutoCloseDayModal]);

  // Auto-close day timer updates - removed frequent updates to improve performance

  const kpis = useMemo(() => {
    if (!gameState) return [];
    const soldMTD = gameState.dailyHistory
      .filter((report) => report.date.includes(`${gameState.year}-${String(gameState.month).padStart(2, '0')}`))
      .reduce((acc, report) => acc + report.salesUnits, 0);
    const soldYTD = gameState.dailyHistory
      .filter((report) => report.date.includes(`${gameState.year}-`))
      .reduce((acc, report) => acc + report.salesUnits, 0);
    return [
      { label: 'Business Level', value: `L${gameState.businessLevel || 1}` },
      { label: 'Cash', value: `$${Math.round(gameState.cash).toLocaleString()}` },
      { label: 'Units In Stock', value: gameState.inventory.filter((vehicle) => vehicle.status === 'inStock').length },
      { label: 'Units Sold (MTD)', value: soldMTD },
      { label: 'Units Sold (YTD)', value: soldYTD },
    ];
  }, [gameState]);

  // Show welcome screen before game starts
  if (!gameStarted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground overflow-hidden">
        <div className="text-center space-y-8 animate-fadeIn">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-slideDown">
              🚗 Dealership Simulator
            </h1>
            <p className="text-xl text-slate-400 animate-slideUp">
              Build your automotive empire from the ground up
            </p>
          </div>
          
          <Button 
            onClick={handleStartGame}
            size="lg"
            className="text-xl px-12 py-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-blue-500/50 animate-bounce"
          >
            🎮 Start Game
          </Button>
          
          <div className="pt-8 space-y-2 text-sm text-slate-500 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <p>• Start small with just 10 used cars and 1 sales advisor</p>
            <p>• Grow your dealership through smart decisions</p>
            <p>• Unlock upgrades and expand your empire</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !gameState) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground">
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
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dealership Simulator</h1>
                <p className="text-lg font-semibold text-blue-400">
                  {new Date(gameState.year, gameState.month - 1).toLocaleDateString(undefined, { month: 'long' })} {gameState.day}, {gameState.year}
                  <span className="ml-3 text-cyan-400">
                    {gameState.hour === 12 ? '12:00 PM' : gameState.hour > 12 ? `${gameState.hour - 12}:00 PM` : gameState.hour === 0 ? '12:00 AM' : `${gameState.hour}:00 AM`}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowBusinessLevelModal(true)}
                className="flex items-center gap-2"
                title="View Business Level"
              >
                <Building2 className="h-5 w-5" />
                <span className="hidden sm:inline">Level {gameState.businessLevel || 1}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUpgradeShopModal(true)}
                className="flex items-center gap-2"
                title="Upgrade Shop"
              >
                <Sparkles className="h-5 w-5" />
                {gameState.availableUpgrades?.filter(u => !u.purchased && u.unlocked).length > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                    {gameState.availableUpgrades.filter(u => !u.purchased && u.unlocked).length}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowControlPanelModal(true)}
                className="flex items-center gap-2"
                title="Control Panel"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button 
                variant={gameState.hour === 21 && gameState.paused ? "default" : "outline"}
                onClick={() => tick(1)}
                className={gameState.hour === 21 && gameState.paused ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' : ''}
              >
                {gameState.hour === 21 && gameState.paused ? '✓ Close Out Day' : 'Close Out Day'}
              </Button>
              {gameState.unlockedFeatures?.includes('speed_controls') && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setSpeed(1)} 
                    className={gameState.speed === 1 ? 'border-primary text-primary' : ''}
                  >
                    1x (2s/hr)
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSpeed(5)} 
                    className={gameState.speed === 5 ? 'border-primary text-primary' : ''}
                  >
                    5x (0.4s/hr)
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSpeed(30)} 
                    className={gameState.speed === 30 ? 'border-primary text-primary' : ''}
                  >
                    Fast (0.067s/hr)
                  </Button>
                </>
              )}
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
            </div>
          </div>
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
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              {/* Only show Service tab if service department is unlocked */}
              {(gameState.purchasedUpgrades?.includes('service_department') || gameState.technicians.length > 0) && (
                <TabsTrigger value="service">Service</TabsTrigger>
              )}
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="achievements" className="relative">
                Achievements
                {gameState.achievements?.filter(a => a.completed).length > 0 && (
                  <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                    {gameState.achievements.filter(a => a.completed).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <Dashboard state={gameState} />
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
            <TabsContent value="achievements">
              <AchievementsView 
                achievements={gameState.achievements || []} 
                storedNotifications={gameState.storedNotifications || []}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Business Level Modal */}
      {gameState && (
        <BusinessLevelModal 
          state={gameState} 
          isOpen={showBusinessLevelModal} 
          onClose={() => setShowBusinessLevelModal(false)} 
        />
      )}

      {/* Control Panel Modal */}
      {gameState && (
        <ControlPanelModal 
          state={gameState} 
          health={health}
          isOpen={showControlPanelModal} 
          onClose={() => setShowControlPanelModal(false)} 
        />
      )}

      {/* Upgrade Shop Modal */}
      {gameState && (
        <UpgradeShopModal 
          state={gameState} 
          isOpen={showUpgradeShopModal} 
          onClose={() => setShowUpgradeShopModal(false)} 
        />
      )}

      {/* Auto-Close Day Modal */}
      {gameState && (
        <AutoCloseDayModal
          gameState={gameState}
          isOpen={showAutoCloseDayModal}
          onClose={() => setShowAutoCloseDayModal(false)}
          onCloseDay={() => tick(1)}
        />
      )}

      <ToastViewport className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2" />
      {toasts.map((toast) => {
        const isDailySummary = toast.description.includes('📊 Day') && toast.description.includes('Complete!');
        
        if (isDailySummary) {
          const handleDismiss = () => {
            dismissToast(toast.id);
            // Auto-resume after dismissing daily summary
            setPaused(false);
          };
          
          return (
            <DailySummaryModal
              key={toast.id}
              title={toast.title}
              description={toast.description}
              onDismiss={handleDismiss}
              autoDismissDelay={20}
            />
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
