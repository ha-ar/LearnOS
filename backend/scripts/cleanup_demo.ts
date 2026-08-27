/**
 * LearnOS Cleanup Runner
 * Runs scripts/cleanup_demo_data.sql against the target database —
 * strips out the pilot demo accounts (Ahmed, Sara, Omar, Ms. Nadia,
 * Mr. Khan Sr., Admin User) and everything tied to them, then seeds
 * Zuha Ali (Grade 7) if she isn't already there.
 *
 * Uses the same DATABASE_URL / SSL logic as seed.ts and migrate.ts,
 * so point it at your live DB the same way you'd point those:
 *
 *   DATABASE_URL="<your cloud DB connection string>" NODE_ENV=production npx tsx scripts/cleanup_demo.ts
 *
 * Safe to run more than once — every step in the SQL file is guarded
 * (DELETE ... WHERE on fixed demo ids, INSERT ... ON CONFLICT DO NOTHING).
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQL_FILE = path.resolve(__dirname, '../scripts/cleanup_demo_data.sql');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('cloudsql') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run(): Promise<void> {
  console.log('\n🧹 LearnOS Demo Cleanup Runner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);

  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('\nRunning cleanup...');
    await client.query('BEGIN');
    const result = await client.query(sql);
    await client.query('COMMIT');

    console.log('\n✅ Cleanup completed successfully!');
    console.log('\nRemaining users:');
    // result is the last statement's result (the SELECT at the end of the SQL file)
    const rows = Array.isArray(result) ? result[result.length - 1]?.rows : result.rows;
    if (rows) {
      for (const r of rows) {
        console.log(`  ${r.role.padEnd(8)} → ${r.email}`);
      }
    }
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('\n❌ Cleanup failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.hint) console.error('Hint:', err.hint);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
