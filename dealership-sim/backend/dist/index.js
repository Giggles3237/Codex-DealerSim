"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const server_1 = require("./server");
const port = Number(process.env.PORT) || 4000;
const seedMode = process.env.SEED_MODE || 'reset';
(0, server_1.startServer)({ port, seedMode }).catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
});
