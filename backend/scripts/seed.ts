/**
 * LearnOS Seed Runner
 * Runs seed/seed_mvp.sql against the target database.
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(__dirname, '../seed/seed_mvp.sql');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('cloudsql') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run(): Promise<void> {
  console.log('\n🌱 LearnOS Seed Runner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);

  const client = await pool.connect();

  try {
    // Check if data is already seeded (check for pilot tenant)
    const check = await client.query(
      `SELECT COUNT(*) FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'`
    );
    const alreadySeeded = parseInt(check.rows[0].count, 10) > 0;

    if (alreadySeeded) {
      console.log('\n⚠️  Seed data already present — skipping to prevent duplicates.');
      console.log('    Run db:reset first if you want a fresh seed.\n');
      return;
    }

    const sql = fs.readFileSync(SEED_FILE, 'utf8');

    console.log('\nRunning seed script...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nStudent seeded (password: LearnOS2026!):');
    console.log('  learner  → zuha.ali@learnos.app');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seed failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.hint) console.error('Hint:', err.hint);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}


run();
