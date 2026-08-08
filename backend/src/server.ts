import dotenv from 'dotenv';
import { app } from './app.js';
import { pool } from './db/index.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 LearnOS Backend API running at http://${HOST}:${PORT}`);
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('Shutting down LearnOS Backend Service...');
  server.close(async () => {
    await pool.end();
    console.log('Database pool closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
