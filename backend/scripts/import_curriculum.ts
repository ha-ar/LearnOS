/**
 * LearnOS Curriculum Importer
 * Loads a curriculum JSON file (grades -> subjects -> topics) into the
 * curricula/competencies tables. Safe to run multiple times: topics are
 * upserted on (curriculum_id, subject, grade_level, sequence_order), and
 * the curriculum row is looked up by name before inserting.
 *
 * Usage:
 *   tsx scripts/import_curriculum.ts [path/to/file.json] [--dry-run]
 *   npm run import:curriculum -- --dry-run
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FILE = path.resolve(__dirname, '../seed/curriculum_ib.json');

interface Topic {
  order: number;
  title: string;
  description: string;
}

interface SubjectBlock {
  subject: string;
  topics: Topic[];
}

interface GradeBlock {
  grade: number;
  programme: string;
  subjects: SubjectBlock[];
}

interface CurriculumFile {
  curriculum: string;
  grades: GradeBlock[];
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.find(a => !a.startsWith('--'));
const SOURCE_FILE = fileArg ? path.resolve(fileArg) : DEFAULT_FILE;

const CURRICULUM_NAME = 'International Baccalaureate';
const CURRICULUM_DESCRIPTION =
  'IB framework: PYP (Grades 1-5) and MYP1-5 (Grades 6-10) across Math, Science, Computer Science, and English.';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://learnos:learnos_dev_password@localhost:5432/learnos_dev',
  ssl: process.env.DATABASE_URL?.includes('cloudsql') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run(): Promise<void> {
  console.log('\n📚 LearnOS Curriculum Importer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Source: ${SOURCE_FILE}`);
  console.log(`Mode:   ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);

  const raw = fs.readFileSync(SOURCE_FILE, 'utf8');
  const data: CurriculumFile = JSON.parse(raw);

  let totalTopics = 0;
  let totalCombos = 0;
  for (const g of data.grades) {
    for (const s of g.subjects) {
      totalCombos++;
      totalTopics += s.topics.length;
    }
  }
  console.log(`\nParsed: ${data.curriculum} — ${data.grades.length} grades, ${totalCombos} grade-subject combos, ${totalTopics} topics`);

  if (dryRun) {
    console.log('\n✅ Dry run parsed successfully. No database changes made.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find-or-create the curriculum row.
    let curriculumId: string;
    const existing = await client.query(
      'SELECT id FROM curricula WHERE name = $1',
      [CURRICULUM_NAME]
    );
    if (existing.rows.length > 0) {
      curriculumId = existing.rows[0].id;
      console.log(`\n↺  Curriculum "${CURRICULUM_NAME}" already exists (${curriculumId}) — reusing.`);
    } else {
      const inserted = await client.query(
        `INSERT INTO curricula (name, country, description) VALUES ($1, $2, $3) RETURNING id`,
        [CURRICULUM_NAME, 'International', CURRICULUM_DESCRIPTION]
      );
      curriculumId = inserted.rows[0].id;
      console.log(`\n✓ Created curriculum "${CURRICULUM_NAME}" (${curriculumId})`);
    }

    // 2. Upsert each topic as a competency row.
    let inserted = 0;
    let updated = 0;
    for (const g of data.grades) {
      const gradeLevel = `Grade ${g.grade}`;
      for (const s of g.subjects) {
        for (const t of s.topics) {
          const result = await client.query(
            `INSERT INTO competencies (curriculum_id, subject, topic, grade_level, programme, sequence_order, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (curriculum_id, subject, grade_level, sequence_order)
             WHERE sequence_order IS NOT NULL
             DO UPDATE SET topic = EXCLUDED.topic, programme = EXCLUDED.programme, description = EXCLUDED.description
             RETURNING (xmax = 0) AS was_insert`,
            [curriculumId, s.subject, t.title, gradeLevel, g.programme, t.order, t.description]
          );
          if (result.rows[0]?.was_insert) inserted++;
          else updated++;
        }
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ Import complete: ${inserted} inserted, ${updated} updated (${inserted + updated} total topics).`);

    // 3. Verification counts.
    const counts = await client.query(
      `SELECT count(*) AS total,
              count(DISTINCT (subject, grade_level)) AS combos,
              count(DISTINCT grade_level) AS grades
       FROM competencies WHERE curriculum_id = $1`,
      [curriculumId]
    );
    console.log(`   Verified in DB: ${counts.rows[0].grades} grades, ${counts.rows[0].combos} subject-grade combos, ${counts.rows[0].total} topics.`);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed:', err.message);
    console.error(err.detail || '');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
