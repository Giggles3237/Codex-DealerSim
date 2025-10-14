import { config } from 'dotenv';
config();

import { startServer } from './server';

const port = Number(process.env.PORT) || 4000;
const seedMode = process.env.SEED_MODE || 'reset';

console.log(`Starting server with PORT=${port}, SEED_MODE=${seedMode}`);
console.log(`Environment PORT: ${process.env.PORT}`);

startServer({ port, seedMode }).catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
