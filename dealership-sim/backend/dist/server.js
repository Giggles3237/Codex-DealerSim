"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const gameRepository_1 = require("./core/repository/gameRepository");
const loop_1 = require("./core/engine/loop");
const seed_1 = require("./data/seed");
const save_1 = require("./utils/save");
const state_1 = __importDefault(require("./routes/state"));
const config_1 = __importDefault(require("./routes/config"));
const control_1 = __importDefault(require("./routes/control"));
const staff_1 = __importDefault(require("./routes/staff"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const marketing_1 = __importDefault(require("./routes/marketing"));
const reports_1 = __importDefault(require("./routes/reports"));
const business_1 = __importDefault(require("./routes/business"));
const upgrades_1 = __importDefault(require("./routes/upgrades"));
const startServer = async ({ port, seedMode }) => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    const savePath = process.env.SAVE_PATH;
    const shouldReset = seedMode === 'reset';
    let initialState = shouldReset ? null : await (0, save_1.loadStateFromFile)(savePath ?? undefined);
    if (!initialState) {
        initialState = (0, seed_1.createSeedState)();
    }
    const repository = new gameRepository_1.GameRepository(initialState);
    const engine = new loop_1.SimulationEngine(repository, { seed: 1337 });
    let interval = null;
    const baseTickInterval = Number(process.env.TICK_INTERVAL_MS) || 2000; // 2 seconds per hour at 1x speed
    const schedule = () => {
        if (interval) {
            clearInterval(interval);
        }
        const state = engine.getState();
        // Auto-advance hours during the day, pause at 9 PM for manual closeout
        if (!state.paused) {
            // Speeds: 1x = 2s/hour, 5x = 0.4s/hour, 30x = 0.067s/hour
            const tickInterval = Math.max(67, baseTickInterval / state.speed);
            interval = setInterval(() => {
                const updated = engine.tick(1); // Advance 1 hour per tick
                if (savePath) {
                    (0, save_1.saveStateToFile)(updated, savePath).catch((error) => console.error('Failed to save state', error));
                }
            }, tickInterval);
        }
    };
    schedule();
    app.use((req, res, next) => {
        req.engine = engine;
        req.repository = repository;
        req.schedule = schedule;
        req.savePath = savePath;
        next();
    });
    app.use('/api', state_1.default);
    app.use('/api', config_1.default);
    app.use('/api', control_1.default);
    app.use('/api', staff_1.default);
    app.use('/api', inventory_1.default);
    app.use('/api', marketing_1.default);
    app.use('/api', reports_1.default);
    app.use('/api', business_1.default);
    app.use('/api', upgrades_1.default);
    app.post('/api/save', async (req, res) => {
        const state = engine.getState();
        try {
            await (0, save_1.saveStateToFile)(state, savePath ?? undefined);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to save game' });
        }
    });
    app.post('/api/load', async (req, res) => {
        try {
            const loaded = await (0, save_1.loadStateFromFile)(savePath ?? undefined);
            if (!loaded) {
                return res.status(404).json({ error: 'No save game found' });
            }
            repository.setState(loaded);
            res.json(engine.getState());
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to load game' });
        }
    });
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
    app.listen(port, () => {
        console.log(`Backend listening on http://localhost:${port}`);
    });
};
exports.startServer = startServer;
