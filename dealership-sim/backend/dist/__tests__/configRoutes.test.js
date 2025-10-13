"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const seed_1 = require("../data/seed");
const gameRepository_1 = require("../core/repository/gameRepository");
const loop_1 = require("../core/engine/loop");
const config_1 = __importDefault(require("../routes/config"));
const createApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const repository = new gameRepository_1.GameRepository((0, seed_1.createSeedState)());
    const engine = new loop_1.SimulationEngine(repository, { seed: 5 });
    app.use((req, _res, next) => {
        req.engine = engine;
        req.repository = repository;
        req.schedule = () => undefined;
        next();
    });
    app.use('/api', config_1.default);
    return app;
};
describe('Config routes', () => {
    it('rejects invalid coefficient payloads', async () => {
        const app = createApp();
        const response = await (0, supertest_1.default)(app).put('/api/config').send({ lead: { basePerDay: 500 } });
        expect(response.status).toBe(400);
    });
});
