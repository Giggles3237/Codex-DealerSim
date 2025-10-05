import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CONFIG_PRESETS, GameState, HealthCheckResult, Coefficients } from '@dealership/shared';
import { safeGet, safePost, safePut } from '../lib/api';

type AcquirePack = 'desirable' | 'neutral' | 'undesirable';

interface GameStore {
  gameState: GameState | null;
  health: HealthCheckResult | null;
  loading: boolean;
  error?: string;
  toasts: { id: string; title: string; description: string }[];
  initialize: () => Promise<void>;
  tick: (days?: number) => Promise<void>;
  setPaused: (paused: boolean) => Promise<void>;
  setSpeed: (speed: 1 | 5 | 30) => Promise<void>;
  acquireInventory: (pack: AcquirePack, qty: number) => Promise<void>;
  updateMarketing: (spend: number) => Promise<void>;
  updateCoefficients: (patch: Partial<Coefficients>) => Promise<void>;
  applyPreset: (id: string) => Promise<void>;
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
        get().pushNotifications(state.notifications);
      } catch (error) {
        set({ loading: false, error: 'Failed to load game state' });
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
      } catch (error) {
        set({ error: 'Acquisition failed' });
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
      if (!preset) return;
      await get().updateCoefficients(preset.coefficients);
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
