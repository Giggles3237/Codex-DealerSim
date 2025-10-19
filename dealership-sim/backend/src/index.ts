console.log('=== BACKEND STARTING ===');

import { config } from 'dotenv';
config();

console.log('=== DOTENV LOADED ===');

import { startServer } from './server';

console.log('=== SERVER MODULE LOADED ===');

const port = Number(process.env.PORT) || 4000;
const seedMode = process.env.SEED_MODE || 'reset';

console.log(`Starting server with PORT=${port}, SEED_MODE=${seedMode}`);
console.log(`Environment PORT: ${process.env.PORT}`);
console.log(`Environment NODE_ENV: ${process.env.NODE_ENV}`);

startServer({ port, seedMode }).catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
