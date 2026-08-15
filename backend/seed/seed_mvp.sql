-- ============================================================
-- LearnOS MVP Seed Data
-- Password for all users: LearnOS2026!
-- Bcrypt hash ($2b$12$) pre-computed. Regenerate with:
--   node -e "const b=require('bcrypt'); b.hash('LearnOS2026!',12).then(console.log)"
-- ============================================================

-- Use a fixed hash for all dev users (same password)
-- $2b$12$K2hFQ1gJv0B0N6qOyUJ4seV5ZK4ZLhWGGFZqvSGF1Ee1r5fP6xHKe = bcrypt('LearnOS2026!', 12)
-- NOTE: In CI, run the seed script through Node/Python to generate real hashes.
-- For local dev, this hardcoded hash is acceptable.

-- ============================================================
-- TENANT
-- ============================================================
INSERT INTO tenants (id, name, type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'LearnOS Pilot Centre', 'learning_centre');

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES
  ('10000000-0000-0000-0000-000000000001',
   'ahmed@pilot.learnos',
   '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
   'Ahmed Khan', 'learner',
   '00000000-0000-0000-0000-000000000001'),

  ('10000000-0000-0000-0000-000000000002',
   'sara@pilot.learnos',
   '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
   'Sara Malik', 'learner',
   '00000000-0000-0000-0000-000000000001'),

  ('10000000-0000-0000-0000-000000000003',
   'omar@pilot.learnos',
   '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
   'Omar Farooq', 'learner',
   '00000000-0000-0000-0000-000000000001'),

  ('20000000-0000-0000-0000-000000000001',
   'mentor@pilot.learnos',
   '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
   'Ms. Nadia', 'mentor',
   '00000000-0000-0000-0000-000000000001'),

  ('30000000-0000-0000-0000-000000000001',
   'parent@pilot.learnos',
   '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
   'Mr. Khan Sr.', 'parent',
   '00000000-0000-0000-0000-000000000001'),

  ('40000000-0000-0000-0000-000000000001',
   'admin@pilot.learnos',
   '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
   'Admin User', 'admin',
   '00000000-0000-0000-0000-000000000001');

-- ============================================================
-- CURRICULUM
-- (Must come before learner_profiles FK is set)
-- ============================================================
INSERT INTO curricula (id, name, country, description) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Pakistan National Curriculum 2006', 'Pakistan',
   'Official national curriculum for primary and secondary education in Pakistan.');

-- ============================================================
-- LEARNER PROFILES
-- ============================================================
INSERT INTO learner_profiles (learner_id, guardian_id, grade, curriculum_id, consent_given, consent_given_at) VALUES
  ('10000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   'Grade 6', 'a0000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '7 days'),

  ('10000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000001',
   'Grade 7', 'a0000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '7 days'),

  ('10000000-0000-0000-0000-000000000003',
   NULL,
   'Grade 8', 'a0000000-0000-0000-0000-000000000001', false, NULL);  -- No consent yet

-- ============================================================
-- MENTOR ASSIGNMENT
-- ============================================================
INSERT INTO learner_mentor_assignments (learner_id, mentor_id, tenant_id, assigned_by) VALUES
  ('10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000001'),

  ('10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000001');
  -- Omar (learner-003) has no consent yet, not assigned

-- ============================================================
-- DEVICES
-- ============================================================
INSERT INTO devices (id, name, room, tenant_id, device_token, platform, last_seen_at) VALUES
  ('d0000000-0000-0000-0000-000000000001',
   'Room 1 Mac', 'Room 1',
   '00000000-0000-0000-0000-000000000001',
   'dev-token-room1-a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
   'macos', NOW()),

  ('d0000000-0000-0000-0000-000000000002',
   'Room 2 Mac', 'Room 2',
   '00000000-0000-0000-0000-000000000001',
   'dev-token-room2-f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3',
   'macos', NOW() - INTERVAL '2 days');

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
-- DIGITAL TWIN — Ahmed (learner-001)
-- ============================================================
INSERT INTO learner_competency_states
  (learner_id, competency_id, mastery_level, mastery_score, attempts_total, attempts_correct,
   learner_confidence, last_practiced_at, review_due_at, evidence_summary)
VALUES
  ('10000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'proficient', 0.78, 12, 9, 4,
   NOW() - INTERVAL '3 days',
   NOW() + INTERVAL '11 days',
   '9 of 12 check questions correct across 3 sessions. Mentor note: strong with halves and quarters; struggles slightly with thirds.'),

  ('10000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002',
   'emerging', 0.33, 3, 1, 2,
   NOW(),
   NOW() + INTERVAL '2 days',
   'First session today. 1 of 3 correct. AI Companion triggered twice. Mentor escalation pending.');

INSERT INTO learner_profiles_twin
  (learner_id, preferred_format, preferred_session_length_min, hint_response, pace_signal)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'video', 40, 'benefits_from_hints', 'average');

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
   NULL, 15, 5, 7,
   'Video lesson explaining how to find equivalent fractions by multiplying or dividing the numerator and denominator by the same number.',
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
  ('b1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'primary'),
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
-- LEARNING PLAN — Ahmed
-- ============================================================
INSERT INTO learning_plans (id, learner_id, curriculum_id, term_label, subject, created_by) VALUES
  ('b3000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'Term 3 2026', 'Mathematics',
   '20000000-0000-0000-0000-000000000001');

INSERT INTO learning_plan_items
  (plan_id, competency_id, sequence_order, target_mastery_level, status)
VALUES
  ('b3000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 'proficient', 'completed'),
  ('b3000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 2, 'proficient', 'in_progress'),
  ('b3000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 3, 'proficient', 'not_started'),
  ('b3000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 4, 'proficient', 'not_started');

-- ============================================================
-- SESSION — Ahmed (today, active)
-- ============================================================
INSERT INTO sessions (id, learner_id, tenant_id, mentor_id, device_id, planned_at, started_at, status, session_goal) VALUES
  ('b4000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   CURRENT_DATE,
   NOW() - INTERVAL '25 minutes',
   'active',
   'Review basic fractions; learn equivalent fractions via video; practise with 5 questions; reflect.');

INSERT INTO session_tasks (id, session_id, task_order, task_type, title, competency_id, resource_id, duration_min, status, started_at, completed_at) VALUES
  ('b5000000-0000-0000-0000-000000000001',
   'b4000000-0000-0000-0000-000000000001',
   1, 'review', 'Quick Review: Basic Fractions',
   'c0000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000003',
   10, 'completed',
   NOW() - INTERVAL '25 minutes',
   NOW() - INTERVAL '15 minutes'),

  ('b5000000-0000-0000-0000-000000000002',
   'b4000000-0000-0000-0000-000000000001',
   2, 'learn', 'Equivalent Fractions – Video Lesson',
   'c0000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000001',
   15, 'active',
   NOW() - INTERVAL '14 minutes',
   NULL),

  ('b5000000-0000-0000-0000-000000000003',
   'b4000000-0000-0000-0000-000000000001',
   3, 'practice', 'Practice Quiz: Equivalent Fractions',
   'c0000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002',
   10, 'pending', NULL, NULL),

  ('b5000000-0000-0000-0000-000000000004',
   'b4000000-0000-0000-0000-000000000001',
   4, 'reflect', 'Session Reflection',
   NULL, NULL, 5, 'pending', NULL, NULL);

-- ============================================================
-- SESSION EVENTS — Ahmed's active session
-- ============================================================
INSERT INTO session_events
  (event_type, session_id, learner_id, tenant_id, resource_id, competency_id, task_id, payload, sequence_num, timestamp)
VALUES
  ('session_started',   'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, NULL, NULL, '{"device_id":"d0000000-0000-0000-0000-000000000001","platform":"macos"}', 1, NOW() - INTERVAL '25 minutes'),
  ('task_started',      'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '{}', 2, NOW() - INTERVAL '25 minutes'),
  ('resource_opened',   'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '{"title":"Basic Fractions – Quick Review Article"}', 3, NOW() - INTERVAL '24 minutes'),
  ('resource_completed','b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '{"time_spent_sec":480}', 4, NOW() - INTERVAL '16 minutes'),
  ('task_completed',    'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '{}', 5, NOW() - INTERVAL '15 minutes'),
  ('task_started',      'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000002', '{}', 6, NOW() - INTERVAL '14 minutes'),
  ('resource_opened',   'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000002', '{"title":"Equivalent Fractions – Khan Academy Video"}', 7, NOW() - INTERVAL '13 minutes'),
  ('video_paused',      'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000002', '{"timestamp_sec":222,"reason":"learner_paused"}', 8, NOW() - INTERVAL '10 minutes'),
  ('hint_requested',    'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000002', '{}', 9, NOW() - INTERVAL '9 minutes'),
  ('ai_question_asked', 'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000002', '{"question":"Why did she divide by two?","mode":"free_question"}', 10, NOW() - INTERVAL '8 minutes'),
  ('check_started',     'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000003', '{"quiz_id":"q1"}', 11, NOW() - INTERVAL '7 minutes'),
  ('check_question_answered', 'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000003', '{"question_id":"q1","is_correct":true}', 12, NOW() - INTERVAL '6 minutes'),
  ('check_question_correct',  'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000003', '{"question_id":"q1"}', 13, NOW() - INTERVAL '6 minutes'),
  ('check_completed',   'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000003', '{"score":100}', 14, NOW() - INTERVAL '5 minutes'),
  ('confidence_reported', 'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', NULL, '{"confidence_score":4}', 15, NOW() - INTERVAL '4 minutes'),
  ('reflection_submitted', 'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, NULL, NULL, '{"text":"Learned equivalent fractions"}', 16, NOW() - INTERVAL '3 minutes'),
  ('session_ended',     'b4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, NULL, NULL, '{}', 17, NOW() - INTERVAL '1 minute');

-- ============================================================
-- SESSION — Sara (today, active, with escalation)
-- ============================================================
INSERT INTO sessions (id, learner_id, tenant_id, mentor_id, device_id, planned_at, started_at, status, session_goal) VALUES
  ('b4000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000002',
   CURRENT_DATE,
   NOW() - INTERVAL '35 minutes',
   'active',
   'Review and practice basic fractions.');

-- ============================================================
-- ESCALATION — Sara needs help
-- ============================================================
INSERT INTO escalations
  (id, session_id, learner_id, tenant_id, assigned_mentor_id, competency_id,
   trigger_type, brief_text, evidence_snapshot, ai_suggested_approach, status)
VALUES
  ('b6000000-0000-0000-0000-000000000001',
   'b4000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'ai_suggested',
   'Sara has answered 3 of 5 check questions incorrectly on Basic Fractions and clicked "I''m stuck" twice. Two AI explanations were attempted. The concept may require hands-on mentor intervention.',
   '{"incorrect_answers":3,"hints_requested":2,"ai_explanations_given":2,"time_stuck_min":12}',
   'Try a worked example using physical objects or drawing fractions on paper. Ask Sara to split a shape into equal parts herself.',
   'pending');

-- ============================================================
-- CONSENT RECORDS
-- ============================================================
INSERT INTO consent_records
  (learner_id, guardian_id, consent_version, data_scope, consent_method, consented_at, admin_who_recorded)
VALUES
  ('10000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   'v1.0',
   ARRAY['session_events','twin','reports','ai_interactions'],
   'admin_recorded',
   NOW() - INTERVAL '7 days',
   '40000000-0000-0000-0000-000000000001'),

  ('10000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000001',
   'v1.0',
   ARRAY['session_events','twin','reports','ai_interactions'],
   'admin_recorded',
   NOW() - INTERVAL '7 days',
   '40000000-0000-0000-0000-000000000001');

-- ============================================================
-- TENANT CONFIG
-- ============================================================
INSERT INTO tenant_config (tenant_id, active_curriculum_id, active_subjects, grade_min, grade_max) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   ARRAY['Mathematics'],
   6, 8);

-- ============================================================
-- MENTOR NOTE (from Sara's earlier session)
-- ============================================================
INSERT INTO mentor_notes
  (learner_id, mentor_id, tenant_id, session_id, competency_id, note_type, note_text, is_parent_visible)
VALUES
  ('10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'b4000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'observation',
   'Ahmed is strong with halves and quarters. Struggles slightly with thirds — needs another 1–2 practice sessions on thirds specifically before moving to equivalent fractions.',
   true);

-- ============================================================
-- WEEKLY REPORT — Ahmed (2026-W30)
-- ============================================================
INSERT INTO weekly_reports
  (id, learner_id, parent_id, tenant_id, week_label, week_start, week_end, status, report_data, mentor_reviewed, generated_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '2000-W30', '2026-07-21', '2026-07-27',
   'ready',
   '{"learner_id":"10000000-0000-0000-0000-000000000001","learner_name":"Ahmed Khan","week_label":"2026-W30","week_start":"2026-07-21","week_end":"2026-07-27","glance":{"sessions_attended":4,"sessions_planned":5,"total_learning_time_min":200,"topics_covered":["Basic Fractions","Equivalent Fractions"],"tasks_completed":14,"tasks_total":16,"mentor_check_ins":2},"summary_text":"Ahmed continued building his understanding of fractions this week. He completed his review of basic fractions and made a great start on equivalent fractions. He needed a bit of extra support from his mentor on Wednesday, and that really helped him get unstuck.","topics":[{"topic":"Basic Fractions","mastery_level":"developing","mastery_label":"Making progress","mastery_percent":78},{"topic":"Equivalent Fractions","mastery_level":"emerging","mastery_label":"Just started","mastery_percent":30}],"confidence_summary":{"average_score":3.2,"scale":5,"text":"Ahmed reported feeling 3 out of 5 confident on equivalent fractions — which is exactly right for this stage."},"next_week_topics":["Equivalent Fractions (continued)","Adding Fractions (same denominator)"],"mentor_note":"Ahmed worked really hard this week and asked great questions! — Ms. Nadia","question_for_home":"Can you ask Ahmed: ''Can you show me two fractions that are the same amount?''"}',
   true,
   NOW())
ON CONFLICT (learner_id, week_label) DO NOTHING;


-- ============================================================
-- ONBOARDING: GRADE 5–7 MATHS LADDER + PLACEMENT DIAGNOSTIC
-- Added to support learner registration -> placement test ->
-- Digital Twin initialisation -> personalised learning plan.
-- Idempotent: safe to re-run.
-- ============================================================

-- Extend the competency ladder (c1..c5 already exist above)
INSERT INTO competencies (id, curriculum_id, subject, topic, grade_level, prerequisite_ids, description) VALUES
  ('c0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Place Value & Whole Numbers', 'Grade 5', '{}',
   'Reading, writing and comparing whole numbers; understanding the value of each digit.'),

  ('c0000000-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Decimals & Place Value', 'Grade 6',
   ARRAY['c0000000-0000-0000-0000-000000000006']::UUID[],
   'Understanding tenths and hundredths; comparing and ordering decimals.'),

  ('c0000000-0000-0000-0000-000000000008',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Fraction–Decimal Conversion', 'Grade 6',
   ARRAY['c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000007']::UUID[],
   'Converting simple fractions to decimals and back.'),

  ('c0000000-0000-0000-0000-000000000009',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Ratios & Proportion', 'Grade 7',
   ARRAY['c0000000-0000-0000-0000-000000000002']::UUID[],
   'Understanding ratios, equivalent ratios and simple proportion problems.'),

  ('c0000000-0000-0000-0000-000000000010',
   'a0000000-0000-0000-0000-000000000001',
   'Mathematics', 'Percentages', 'Grade 7',
   ARRAY['c0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000009']::UUID[],
   'Understanding percentages as fractions of 100; finding a percentage of a quantity.')
ON CONFLICT (id) DO NOTHING;

-- Primary lesson resources for ladder competencies that lack one (c3..c10)
INSERT INTO resources (id, provider_id, title, format, url, duration_min, grade_min, grade_max, description, content_body) VALUES
  ('b3000000-0000-0000-0000-000000000103','b0000000-0000-0000-0000-000000000002','Adding Fractions with the Same Denominator — Lesson','article',NULL,10,6,7,'Add fractions that share a denominator by adding the numerators.',NULL),
  ('b3000000-0000-0000-0000-000000000104','b0000000-0000-0000-0000-000000000002','Adding Fractions with Different Denominators — Lesson','article',NULL,12,6,7,'Find a common denominator, then add unlike fractions.',NULL),
  ('b3000000-0000-0000-0000-000000000105','b0000000-0000-0000-0000-000000000002','Multiplying Fractions — Lesson','article',NULL,10,6,7,'Multiply numerators and denominators; simplify the result.',NULL),
  ('b3000000-0000-0000-0000-000000000106','b0000000-0000-0000-0000-000000000002','Place Value & Whole Numbers — Lesson','article',NULL,10,5,6,'Understand the value of each digit in a whole number.',NULL),
  ('b3000000-0000-0000-0000-000000000107','b0000000-0000-0000-0000-000000000002','Understanding Decimals — Lesson','article',NULL,10,5,7,'Tenths and hundredths; comparing and ordering decimals.',NULL),
  ('b3000000-0000-0000-0000-000000000108','b0000000-0000-0000-0000-000000000002','Converting Fractions to Decimals — Lesson','article',NULL,10,6,7,'Turn simple fractions into decimals and back again.',NULL),
  ('b3000000-0000-0000-0000-000000000109','b0000000-0000-0000-0000-000000000002','Ratios & Proportion — Lesson','article',NULL,12,6,7,'Compare quantities with ratios and solve simple proportions.',NULL),
  ('b3000000-0000-0000-0000-000000000110','b0000000-0000-0000-0000-000000000002','Percentages — Lesson','article',NULL,12,6,7,'Percentages as parts of 100; find a percentage of a quantity.',NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resource_competency_map (resource_id, competency_id, fit_type) VALUES
  ('b3000000-0000-0000-0000-000000000103','c0000000-0000-0000-0000-000000000003','primary'),
  ('b3000000-0000-0000-0000-000000000104','c0000000-0000-0000-0000-000000000004','primary'),
  ('b3000000-0000-0000-0000-000000000105','c0000000-0000-0000-0000-000000000005','primary'),
  ('b3000000-0000-0000-0000-000000000106','c0000000-0000-0000-0000-000000000006','primary'),
  ('b3000000-0000-0000-0000-000000000107','c0000000-0000-0000-0000-000000000007','primary'),
  ('b3000000-0000-0000-0000-000000000108','c0000000-0000-0000-0000-000000000008','primary'),
  ('b3000000-0000-0000-0000-000000000109','c0000000-0000-0000-0000-000000000009','primary'),
  ('b3000000-0000-0000-0000-000000000110','c0000000-0000-0000-0000-000000000010','primary')
ON CONFLICT (resource_id, competency_id) DO NOTHING;

-- Placement diagnostic quiz resource
INSERT INTO resources (id, provider_id, title, format, url, duration_min, grade_min, grade_max, description, content_body) VALUES
  ('b1000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000002','Mathematics Placement Diagnostic (Grade 5–7)','internal_quiz',NULL,15,5,7,'Short adaptive placement test spanning the Grade 5–7 Maths ladder. Used to initialise a learner Digital Twin.',NULL)
ON CONFLICT (id) DO NOTHING;

-- Placement questions — one per ladder competency, tagged with competency + grade
INSERT INTO quiz_questions
  (id, resource_id, competency_id, question_text, question_type, options, correct_answer, explanation, difficulty, grade_level, display_order)
VALUES
  ('b2000000-0000-0000-0000-000000000101','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000006',
   'In the number 4,382, what is the value of the digit 3?','multiple_choice',
   '[{"key":"a","text":"3"},{"key":"b","text":"30"},{"key":"c","text":"300"},{"key":"d","text":"3000"}]','c',
   'The 3 is in the hundreds place, so its value is 300.','easy',5,1),

  ('b2000000-0000-0000-0000-000000000102','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000001',
   'A pizza is cut into 4 equal slices. What fraction is one slice?','multiple_choice',
   '[{"key":"a","text":"1/2"},{"key":"b","text":"1/3"},{"key":"c","text":"1/4"},{"key":"d","text":"1/8"}]','c',
   'One of four equal parts is 1/4.','easy',6,2),

  ('b2000000-0000-0000-0000-000000000103','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000002',
   'Which fraction is equivalent to 1/2?','multiple_choice',
   '[{"key":"a","text":"2/3"},{"key":"b","text":"2/4"},{"key":"c","text":"3/5"},{"key":"d","text":"1/4"}]','b',
   '1/2 = 2/4 (multiply top and bottom by 2).','easy',6,3),

  ('b2000000-0000-0000-0000-000000000104','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000003',
   'What is 2/7 + 3/7?','multiple_choice',
   '[{"key":"a","text":"5/7"},{"key":"b","text":"5/14"},{"key":"c","text":"6/7"},{"key":"d","text":"1/7"}]','a',
   'Same denominator: add the numerators, 2+3=5, so 5/7.','easy',6,4),

  ('b2000000-0000-0000-0000-000000000105','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000007',
   'Which decimal is larger: 0.7 or 0.65?','multiple_choice',
   '[{"key":"a","text":"0.7"},{"key":"b","text":"0.65"},{"key":"c","text":"They are equal"},{"key":"d","text":"Cannot tell"}]','a',
   '0.70 is greater than 0.65.','medium',6,5),

  ('b2000000-0000-0000-0000-000000000106','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000008',
   'What is 1/2 written as a decimal?','multiple_choice',
   '[{"key":"a","text":"0.2"},{"key":"b","text":"0.5"},{"key":"c","text":"0.12"},{"key":"d","text":"1.2"}]','b',
   '1 divided by 2 = 0.5.','medium',6,6),

  ('b2000000-0000-0000-0000-000000000107','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000004',
   'What is 1/2 + 1/4?','multiple_choice',
   '[{"key":"a","text":"2/6"},{"key":"b","text":"3/4"},{"key":"c","text":"1/6"},{"key":"d","text":"2/4"}]','b',
   'Common denominator 4: 1/2 = 2/4, then 2/4 + 1/4 = 3/4.','medium',7,7),

  ('b2000000-0000-0000-0000-000000000108','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000005',
   'What is 1/2 × 1/3?','multiple_choice',
   '[{"key":"a","text":"1/6"},{"key":"b","text":"2/5"},{"key":"c","text":"1/5"},{"key":"d","text":"2/6"}]','a',
   'Multiply tops (1×1=1) and bottoms (2×3=6): 1/6.','medium',7,8),

  ('b2000000-0000-0000-0000-000000000109','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000009',
   'The ratio of boys to girls is 2:3. If there are 6 boys, how many girls are there?','multiple_choice',
   '[{"key":"a","text":"9"},{"key":"b","text":"4"},{"key":"c","text":"6"},{"key":"d","text":"12"}]','a',
   '6 boys is 2 parts, so 1 part = 3; girls = 3 parts = 9.','hard',7,9),

  ('b2000000-0000-0000-0000-000000000110','b1000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000010',
   'What is 25% of 80?','multiple_choice',
   '[{"key":"a","text":"20"},{"key":"b","text":"25"},{"key":"c","text":"40"},{"key":"d","text":"15"}]','a',
   '25% = 1/4, and 80 ÷ 4 = 20.','hard',7,10)
ON CONFLICT (id) DO NOTHING;
