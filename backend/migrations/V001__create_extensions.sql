-- V001: PostgreSQL Extensions
-- Must run first — all other migrations depend on gen_random_uuid()

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
