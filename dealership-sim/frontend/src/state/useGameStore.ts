import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CONFIG_PRESETS, GameState, HealthCheckResult, Coefficients, PricingPolicy, Vehicle, DeepPartial } from '@dealership/shared';
import { safeGet, safePost, safePut } from '../lib/api';

type AcquirePack = 'desirable' | 'neutral' | 'undesirable';

interface GameStore {
  gameState: GameState | null;
  health: HealthCheckResult | null;
  loading: boolean;
  error?: string;
  toasts: { id: string; title: string; description: string }[];
  initialize: () => Promise<void>;
  refreshState: () => Promise<void>;
  tick: (days?: number) => Promise<void>;
  setPaused: (paused: boolean) => Promise<void>;
  setSpeed: (speed: 1 | 5 | 30) => Promise<void>;
  acquireInventory: (pack: AcquirePack, qty: number) => Promise<void>;
  updateMarketing: (spend: number) => Promise<void>;
  updateCoefficients: (patch: DeepPartial<Coefficients>) => Promise<void>;
  applyPreset: (id: string) => Promise<void>;
  setPricingPolicy: (globalPolicy?: PricingPolicy, segment?: Vehicle['segment'], policy?: PricingPolicy) => Promise<void>;
  adjustVehiclePrice: (vehicleId: string, adjustment: number) => Promise<void>;
  setAgingDiscounts: (days60: number, days90: number) => Promise<void>;
  resetGame: () => Promise<void>;
  upgradeBusiness: () => Promise<void>;
  setSalesGoal: (goal: number) => Promise<void>;
  hireManager: () => Promise<void>;
  purchaseUpgrade: (upgradeId: string) => Promise<void>;
  clearError: () => void;
  dismissToast: (id: string) => void;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    gameState: null,
    health: null,
    loading: false,
    toasts: [],
    async initialize() {
      set({ loading: true, error: undefined });
      try {
        const state = await safeGet<GameState>('/api/state');
        const config = await safeGet<{ coefficients: Coefficients; health: HealthCheckResult }>('/api/config');
        set({ gameState: state, health: config.health, loading: false });
        if (state.notifications) {
          get().pushNotifications(state.notifications);
        }
      } catch (error) {
        console.error('Failed to initialize game:', error);
        set({ loading: false, error: 'Failed to load game state' });
      }
    },
    async refreshState() {
      try {
        const state = await safeGet<GameState>('/api/state');
        set({ gameState: state });
        // Don't push notifications on refresh - only on explicit actions
      } catch (error) {
        console.error('Failed to refresh state:', error);
        // Silent fail for background refresh
      }
    },
    async tick(days = 1) {
      try {
        const state = await safePost<GameState>('/api/tick', { days });
        set((draft) => {
          draft.gameState = state;
        });
        get().pushNotifications(state.notifications);
      } catch (error) {
        set({ error: 'Tick failed' });
      }
    },
    async setPaused(paused) {
      const state = await safePost<GameState>('/api/pause', { paused });
      set({ gameState: state });
    },
    async setSpeed(speed) {
      const state = await safePost<GameState>('/api/speed', { multiplier: speed });
      set({ gameState: state });
    },
    async acquireInventory(pack, qty) {
      try {
        const state = await safePost<GameState>('/api/inventory/acquire', { pack, qty });
        set({ gameState: state });
        get().pushNotifications([`Acquired ${qty} vehicles (${pack})`]);
      } catch (error: any) {
        console.error('Acquisition failed:', error);
        const errorMessage = error.response?.data?.error || 'Acquisition failed';
        set({ error: typeof errorMessage === 'string' ? errorMessage : 'Acquisition failed' });
        get().pushNotifications([`Error: ${typeof errorMessage === 'string' ? errorMessage : 'Acquisition failed'}`]);
      }
    },
    async updateMarketing(spend) {
      const state = await safePost<GameState>('/api/marketing/spend', { perDay: spend });
      set({ gameState: state });
    },
    async updateCoefficients(patch) {
      const response = await safePut<{ coefficients: Coefficients; health: HealthCheckResult }>('/api/config', patch);
      set((draft) => {
        if (draft.gameState) {
          draft.gameState.coefficients = response.coefficients;
        }
        draft.health = response.health;
      });
    },
    async applyPreset(id) {
      const preset = CONFIG_PRESETS.find((item) => item.id === id);
      if (!preset) {
        set({ error: `Preset "${id}" not found` });
        return;
      }
      try {
        await get().updateCoefficients(preset.coefficients);
        get().pushNotifications([`Applied "${preset.name}" preset: ${preset.description}`]);
      } catch (error: any) {
        set({ error: `Failed to apply preset: ${error.message}` });
      }
    },
    async setPricingPolicy(globalPolicy, segment, policy) {
      try {
        const state = await safePost<GameState>('/api/inventory/pricing-policy', {
          globalPolicy,
          segment,
          policy,
        });
        set({ gameState: state });
        get().pushNotifications(state.notifications);
      } catch (error) {
        set({ error: 'Failed to update pricing policy' });
      }
    },
    async adjustVehiclePrice(vehicleId, adjustment) {
      try {
        const state = await safePost<GameState>('/api/inventory/adjust-price', {
          vehicleId,
          adjustment,
        });
        set({ gameState: state });
      } catch (error) {
        set({ error: 'Failed to adjust vehicle price' });
      }
    },
    async setAgingDiscounts(days60, days90) {
      try {
        const state = await safePost<GameState>('/api/inventory/aging-discounts', {
          days60,
          days90,
        });
        set({ gameState: state });
        get().pushNotifications(state.notifications);
      } catch (error) {
        set({ error: 'Failed to update aging discounts' });
      }
    },
    async resetGame() {
      set({ loading: true, error: undefined });
      try {
        const state = await safePost<GameState>('/api/reset');
        const config = await safeGet<{ coefficients: Coefficients; health: HealthCheckResult }>('/api/config');
        set({ gameState: state, health: config.health, loading: false });
        get().pushNotifications(['Game has been reset to initial state']);
      } catch (error) {
        set({ loading: false, error: 'Failed to reset game' });
      }
    },
    async upgradeBusiness() {
      try {
        const state = await safePost<GameState>('/api/business/upgrade');
        set({ gameState: state });
        get().pushNotifications([`Business upgraded to Level ${state.businessLevel}!`]);
      } catch (error) {
        set({ error: 'Failed to upgrade business' });
      }
    },
    async setSalesGoal(goal: number) {
      try {
        const state = await safePost<GameState>('/api/sales-goal', { goal });
        set({ gameState: state });
        get().pushNotifications([`Sales goal updated to ${goal} cars/year`]);
      } catch (error) {
        set({ error: 'Failed to update sales goal' });
      }
    },
    async hireManager() {
      try {
        const state = await safePost<GameState>('/api/staff/hire', { role: 'manager' });
        set({ gameState: state });
        get().pushNotifications(['Sales Manager hired! You can now use auto-advance.']);
      } catch (error: any) {
        set({ error: error.message || 'Failed to hire Sales Manager' });
      }
    },
    async purchaseUpgrade(upgradeId: string) {
      try {
        const state = await safePost<GameState>('/api/upgrades/purchase', { upgradeId });
        set({ gameState: state });
        get().pushNotifications(state.notifications);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to purchase upgrade';
        set({ error: typeof errorMessage === 'string' ? errorMessage : 'Failed to purchase upgrade' });
        get().pushNotifications([`Error: ${typeof errorMessage === 'string' ? errorMessage : 'Failed to purchase upgrade'}`]);
      }
    },
    clearError() {
      set({ error: undefined });
    },
    dismissToast(id) {
      set((draft) => {
        draft.toasts = draft.toasts.filter((toast) => toast.id !== id);
      });
    },
    pushNotifications(messages: string[]) {
      if (!messages?.length) return;
      set((draft) => {
        messages.forEach((message, index) => {
          draft.toasts.push({
            id: `${Date.now()}-${index}`,
            title: 'Update',
            description: message,
          });
        });
      });
    },
  })) as unknown as GameStore & { pushNotifications: (messages: string[]) => void },
);
