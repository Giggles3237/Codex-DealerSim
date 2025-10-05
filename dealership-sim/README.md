# Dealership Simulator

A tick-based idle/management simulator where you run a BMW/MINI inspired dealership. Monitor sales, service, inventory, morale, and balancing coefficients in real time while keeping the store profitable.

## Quick Start

```bash
pnpm install
pnpm dev
```

- Backend available at http://localhost:4000
- Frontend dashboard at http://localhost:5173

### Additional scripts

| Command | Description |
| --- | --- |
| `pnpm build` | Build all workspaces |
| `pnpm test` | Run backend Jest tests and frontend Vitest suites |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm format` | Run Prettier across the repo |

Create a `.env` file in `backend/` if you need to customise `PORT`, `SEED_MODE`, `SAVE_PATH`, or `TICK_INTERVAL_MS` (see `.env.example`).

## Game Manual

- **Time** – Each tick advances one simulated day. Use the ticker controls (Pause/Play, 1x/5x/30x, Step Day) to manage pacing.
- **Sales Funnel** – Leads flow to appointments and deals. Advisor morale and archetypes influence close rate, CSI, and gross.
- **Inventory** – Vehicles age daily, depreciate, and auto-replenish when days-supply drops below thresholds. Use the Acquire panel for manual bulk buys.
- **Service** – Technician efficiency and morale drive hours billed. Comebacks reduce CSI which feeds future demand.
- **Marketing** – Adjust spend to increase lead flow with diminishing returns. Economy events (incentives, weather, audits) adjust demand.
- **Finance** – Cash updates daily from sales and fixed ops. Guardrails ensure expected gross supports future restocking; warnings appear if starvation risk rises.

### Control Panel Cheat Sheet

- **Presets** – Easy/Balanced/Hard/Wild adjust key coefficients instantly.
- **Marketing & Lead Generation** – Tune lead volume and diminishing returns, plus daily marketing spend.
- **Sales Tuning** – Adjust how desirability, pricing, economy, and archetypes affect closing probability.
- **Inventory & Pricing** – Control days supply guardrails, auction spreads, and pricing variance.
- **Health Check** – Real-time warning when expected gross falls below replacement needs.

### Save & Load

- `POST /api/save` writes the current state to `backend/data/save.json` (or custom `SAVE_PATH`).
- `POST /api/load` reloads from disk. The server auto-saves at each scheduled tick when `SAVE_PATH` is configured.

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Zustand, TailwindCSS, shadcn-inspired UI primitives, Recharts, lucide-react icons.
- **Backend**: Node + TypeScript, Express, Jest. Tick-based simulation engine with repository pattern and optional JSON persistence.
- **Shared**: Common type system and default balancing constants shared across packages.
- **Tooling**: pnpm workspaces, ESLint, Prettier, Vitest, Jest.

### Architecture Overview

```
┌────────────────────────┐       ┌────────────────────────┐
│        Frontend        │  API  │        Backend         │
│  React + Zustand store │◄─────►│ Express + Simulation   │
│  Dashboard & Features  │       │ Engine + Repository    │
└─────────▲──────────────┘       └─────────▲──────────────┘
          │                                │
          │                                │
          ▼                                ▼
  ┌──────────────┐              ┌──────────────────┐
  │  shared/     │◄────────────►│  In-memory state │
  │  types + cfg │              │  JSON persistence│
  └──────────────┘              └──────────────────┘
```

## Balancing Notes

- Lead generation uses `lead.basePerDay * demandIndex * (1 + marketingK * ln(1 + spendPerDay))`.
- Closing probability runs through a sigmoid across advisor skill, customer bias, desirability, price fit, and economy.
- Guardrail health check compares expected front/back gross to target replacement gross, warning when inventory starvation is likely.
- Service production scales with technician efficiency and morale; comebacks impact CSI which feeds future demand multipliers.

## Testing

- Backend Jest suite covers engine determinism, guardrails, inventory cash checks, sales desirability monotonicity, service CSI impacts, and config validation.
- Frontend Vitest suite ensures key dashboard KPIs render.

Enjoy running the store — keep the cash flowing, morale high, and CSI climbing!
