"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log('=== BACKEND STARTING ===');
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
console.log('=== DOTENV LOADED ===');
const server_1 = require("./server");
console.log('=== SERVER MODULE LOADED ===');
const port = Number(process.env.PORT) || 4000;
const seedMode = process.env.SEED_MODE || 'reset';
console.log(`Starting server with PORT=${port}, SEED_MODE=${seedMode}`);
console.log(`Environment PORT: ${process.env.PORT}`);
console.log(`Environment NODE_ENV: ${process.env.NODE_ENV}`);
(0, server_1.startServer)({ port, seedMode }).catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
});
