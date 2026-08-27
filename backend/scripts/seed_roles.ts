/**
 * LearnOS Seed Roles Runner
 * Seeds 1 user for each role: learner, mentor, parent, admin, superadmin.
 * Safe to run multiple times (uses ON CONFLICT clauses).
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQL_FILE = path.resolve(__dirname, '../scripts/seed_roles.sql');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('cloudsql') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run(): Promise<void> {
  console.log('\n👥 LearnOS Seed Roles Runner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);

  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('\nSeeding 1 user per role...');
    await client.query('BEGIN');
    const result = await client.query(sql);
    await client.query('COMMIT');

    console.log('\n✅ Role seeding complete!');
    console.log('\nSeeded users:');
    const rows = Array.isArray(result) ? result[result.length - 1]?.rows : result.rows;
    if (rows) {
      for (const r of rows) {
        console.log(`  ${r.role.padEnd(12)} → ${r.email.padEnd(25)} (${r.name})`);
      }
    }
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('\n❌ Role seeding failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
