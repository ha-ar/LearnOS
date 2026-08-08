/**
 * LearnOS Database Migration Runner
 * Reads migration files from /migrations/V*.sql and applies them in order.
 * Tracks applied migrations in schema_migrations table.
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('cloudsql') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});

async function ensureMigrationsTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      checksum VARCHAR(64)
    );
  `);
  console.log('✓ schema_migrations table ready');
}

async function getAppliedMigrations(client: pg.PoolClient): Promise<Set<string>> {
  const result = await client.query('SELECT version FROM schema_migrations ORDER BY version');
  return new Set(result.rows.map((r: any) => r.version));
}

async function applyMigration(client: pg.PoolClient, filename: string, sql: string): Promise<void> {
  const version = filename.replace('.sql', '');
  const checksum = Buffer.from(sql).toString('base64').substring(0, 64);

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
      [version, checksum]
    );
    await client.query('COMMIT');
    console.log(`  ✓ Applied: ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function run(): Promise<void> {
  console.log('\n🗄  LearnOS Migration Runner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);

  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    // Read and sort migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql') && f.startsWith('V'))
      .sort();

    console.log(`\nFound ${files.length} migration files, ${applied.size} already applied\n`);

    let newCount = 0;
    for (const file of files) {
      const version = file.replace('.sql', '');
      if (applied.has(version)) {
        console.log(`  ⏭  Skipped: ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await applyMigration(client, file, sql);
      newCount++;
    }

    console.log(`\n${'─'.repeat(40)}`);
    if (newCount === 0) {
      console.log('✅ Database is already up to date — no migrations to apply.');
    } else {
      console.log(`✅ Successfully applied ${newCount} migration(s).`);
    }
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err.detail || '');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
