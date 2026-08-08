/**
 * LearnOS Database Reset Script
 * Drops all tables and re-runs migrations + seed.
 * ONLY FOR DEVELOPMENT — never run against production!
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const execAsync = promisify(exec);
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('cloudsql') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SAFETY: Cannot run reset in production!');
    process.exit(1);
  }

  console.log('\n🔄 LearnOS DB Reset (DEV ONLY)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const client = await pool.connect();
  try {
    console.log('Dropping all tables...');
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO PUBLIC;
    `);
    console.log('✓ All tables dropped');
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\nRunning migrations...');
  const { stdout: migrateOut } = await execAsync('npx tsx scripts/migrate.ts', {
    cwd: process.cwd(),
    env: { ...process.env }
  });
  console.log(migrateOut);

  console.log('Running seed...');
  const { stdout: seedOut } = await execAsync('npx tsx scripts/seed.ts', {
    cwd: process.cwd(),
    env: { ...process.env }
  });
  console.log(seedOut);

  console.log('\n✅ Database reset complete!');
}

run().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
