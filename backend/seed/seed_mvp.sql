-- ============================================================
-- LearnOS Seed Data
-- Password for seeded users: LearnOS2026!
-- Bcrypt hash ($2b$12$) pre-computed. Regenerate with:
--   node -e "const b=require('bcrypt'); b.hash('LearnOS2026!',12).then(console.log)"
-- ============================================================

-- ============================================================
-- TENANT
-- ============================================================
INSERT INTO tenants (id, name, type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'LearnOS Pilot Centre', 'learning_centre');

-- ============================================================
-- CURRICULUM
-- ============================================================
INSERT INTO curricula (id, name, country, description) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Pakistan National Curriculum 2006', 'Pakistan',
   'Official national curriculum for primary and secondary education in Pakistan.');

-- ============================================================
-- LEARNER — Zuha Ali (Grade 7, IB MYP2)
-- The only seeded student. No pre-existing sessions, plans, or
-- digital-twin state — her first learning session is generated
-- automatically by the backend (SessionService.generateSessionPlan)
-- the first time she logs in, picking from her grade's competencies.
--
-- IMPORTANT — run order for a fresh database:
--   1. npm run migrate
--   2. npm run import:curriculum   (loads seed/curriculum_ib.json,
--      creates the "International Baccalaureate" curriculum row)
--   3. npm run seed                (this file)
-- Zuha's curriculum_id below is looked up by name rather than a
-- fixed UUID because import_curriculum.ts generates that id at
-- import time. If you run this file before step 2, she'll be
-- created with curriculum_id = NULL — just re-run step 2 then
-- the UPDATE at the bottom of scripts/assign_zuha_ib.sql.
-- ============================================================
INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES
  ('50000000-0000-0000-0000-000000000001',
   'zuha.ali@learnos.app',
   '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
   'Zuha Ali', 'learner',
   '00000000-0000-0000-0000-000000000001');

INSERT INTO learner_profiles (learner_id, guardian_id, grade, curriculum_id, consent_given, consent_given_at) VALUES
  ('50000000-0000-0000-0000-000000000001',
   NULL,
   'Grade 7',
   (SELECT id FROM curricula WHERE name = 'International Baccalaureate'),
   true, NOW());

-- ============================================================
-- COMPETENCIES (Mathematics, Pakistan NC)
-- ============================================================
INSERT INTO competencies (id, curriculum_id, subject, topic, grade_level, prerequisite_ids, description) VALUES
  ('c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Basic Fractions', 'Grade 6', '{}',
   'Understanding halves, quarters and thirds; representing fractions on a number line.'),

  ('c0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Equivalent Fractions', 'Grade 6',
   ARRAY['c0000000-0000-0000-0000-000000000001']::UUID[],
   'Finding and verifying equivalent fractions; simplifying fractions.'),

  ('c0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Adding Fractions (Same Denominator)', 'Grade 6',
   ARRAY['c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002']::UUID[],
   'Adding fractions with the same denominator; word problems.'),

  ('c0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Adding Fractions (Different Denominator)', 'Grade 7',
   ARRAY['c0000000-0000-0000-0000-000000000003']::UUID[],
   'Finding common denominators; adding unlike fractions.'),

  ('c0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Multiplying Fractions', 'Grade 7',
   ARRAY['c0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003']::UUID[],
   'Multiplying fractions and mixed numbers.');

-- ============================================================
-- RESOURCE PROVIDERS (LearnOS Internal Only — no 3rd party)
-- ============================================================
INSERT INTO resource_providers (id, name, type, base_url, attribution_text) VALUES
  ('b0000000-0000-0000-0000-000000000002',
   'LearnOS Internal', 'internal',
   NULL,
   'LearnOS Learning Content © LearnOS 2026'),

  ('b0000000-0000-0000-0000-000000000003',
   'LearnOS AI Generator', 'api',
   NULL,
   'AI-generated lesson content by LearnOS (Powered by Google Gemini)');

-- ============================================================
-- RESOURCES (All internal — no external URLs)
-- ============================================================
INSERT INTO resources (id, provider_id, title, format, url, duration_min, grade_min, grade_max, description, content_body) VALUES
  ('b1000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'Equivalent Fractions – Khan Academy Video',
   'other',
   'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic/arith-review-equivalent-fractions/v/equivalent-fractions',
   15, 5, 7,
   'Video lesson walking through equivalent fractions using the multiply-top-and-bottom method.',
   NULL),

  ('b1000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000002',
   'Equivalent Fractions – Practice Quiz (5 Questions)',
   'internal_quiz',
   NULL, 10, 5, 7,
   'Five multiple-choice questions testing equivalent fraction identification and simplification.',
   NULL),

  ('b1000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000002',
   'Basic Fractions – Quick Review Article',
   'article',
   NULL, 5, 4, 6,
   'Text-based review of basic fraction concepts: halves, thirds, quarters.',
   '## What is a Fraction?

A fraction represents a part of a whole. When you cut a pizza into 4 equal slices and eat 1 slice, you have eaten **1/4** of the pizza.

The **top number** (numerator) tells you how many parts you have. The **bottom number** (denominator) tells you how many equal parts the whole is divided into.

## Common Fractions

- **1/2** — one half (cut into 2 equal parts, take 1)
- **1/4** — one quarter (cut into 4 equal parts, take 1)
- **3/4** — three quarters (cut into 4 equal parts, take 3)
- **1/3** — one third (cut into 3 equal parts, take 1)

## Key Idea

A fraction is just a way of writing division. **1/4 = 1 ÷ 4**. If you have 8 chocolates and divide them equally between 4 friends, each friend gets **8/4 = 2** chocolates.'),

  ('b1000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000002',
   'Equivalent Fractions – Worked Example',
   'worked_example',
   NULL, 7, 5, 7,
   'Step-by-step worked example using the multiply-top-and-bottom method.',
   '## How to Find Equivalent Fractions

Equivalent fractions are different fractions that represent the **exact same amount**.

### Method: Multiply Top and Bottom by the Same Number

**Example 1:** Is 2/3 equivalent to 4/6?

- Multiply numerator: 2 × 2 = **4**
- Multiply denominator: 3 × 2 = **6**
- Result: 2/3 = 4/6 ✅

**Example 2:** Find 3 fractions equivalent to 1/2:

| Multiply by | Result |
|-------------|--------|
| 2           | 2/4    |
| 3           | 3/6    |
| 5           | 5/10   |

### Method: Divide (Simplify)

To simplify 8/12, find the GCF of 8 and 12:
- GCF(8, 12) = 4
- 8 ÷ 4 = **2**, 12 ÷ 4 = **3**
- 8/12 = **2/3** ✅'),

  ('b1000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000003',
   'Equivalent Fractions – AI Generated Lesson',
   'ai_lesson',
   NULL, 12, 5, 7,
   'AI-generated personalised lesson on Equivalent Fractions (cached after first generation).',
   NULL);

-- ============================================================
-- RESOURCE ↔ COMPETENCY MAP
-- ============================================================
INSERT INTO resource_competency_map (resource_id, competency_id, fit_type) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'primary'),
  ('b1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'primary'),
  ('b1000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'supplementary'),
  ('b1000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'supplementary');

-- ============================================================
-- QUIZ QUESTIONS (for res-002)
-- ============================================================
INSERT INTO quiz_questions
  (id, resource_id, competency_id, question_text, question_type, options, correct_answer, explanation, difficulty, display_order)
VALUES
  ('b2000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'Which fraction is equivalent to 1/2?',
   'multiple_choice',
   '[{"key":"a","text":"2/3"},{"key":"b","text":"2/4"},{"key":"c","text":"3/4"},{"key":"d","text":"4/5"}]',
   'b',
   '1/2 = 2/4 because we multiply both numerator and denominator by 2. Check: 1×2=2, 2×2=4.',
   'easy', 1),

  ('b2000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'Which fraction is equivalent to 2/3?',
   'multiple_choice',
   '[{"key":"a","text":"4/6"},{"key":"b","text":"3/5"},{"key":"c","text":"4/5"},{"key":"d","text":"6/8"}]',
   'a',
   '2/3 = 4/6 because 2×2=4 and 3×2=6. Multiply top and bottom by the same number.',
   'easy', 2),

  ('b2000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'Simplify 6/8 to its simplest form.',
   'multiple_choice',
   '[{"key":"a","text":"2/3"},{"key":"b","text":"3/4"},{"key":"c","text":"4/6"},{"key":"d","text":"3/5"}]',
   'b',
   '6 and 8 share a common factor of 2. Divide both by 2: 6÷2=3, 8÷2=4. So 6/8 = 3/4.',
   'medium', 3),

  ('b2000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'Are 3/4 and 9/12 equivalent fractions?',
   'true_false',
   '[{"key":"a","text":"Yes"},{"key":"b","text":"No"}]',
   'a',
   'Yes! 3/4 × 3/3 = 9/12. Multiply top and bottom by 3 to check.',
   'medium', 4),

  ('b2000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'What is the simplest form of 10/15?',
   'multiple_choice',
   '[{"key":"a","text":"5/7"},{"key":"b","text":"2/4"},{"key":"c","text":"2/3"},{"key":"d","text":"3/5"}]',
   'c',
   '10 and 15 share a common factor of 5. 10÷5=2, 15÷5=3. So 10/15 = 2/3.',
   'hard', 5);

-- ============================================================
-- TENANT CONFIG
-- ============================================================
INSERT INTO tenant_config (tenant_id, active_curriculum_id, active_subjects, grade_min, grade_max) VALUES
  ('00000000-0000-0000-0000-000000000001',
   (SELECT id FROM curricula WHERE name = 'International Baccalaureate'),
   ARRAY['Math','Science','Computer Science','English'],
   1, 10);
