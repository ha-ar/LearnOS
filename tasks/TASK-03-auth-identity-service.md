# TASK-03: Authentication & Identity Service

## Overview
Build the authentication and identity service that handles learner login, mentor login, parent login, admin login, and device registration. This is a shared backend service used by all LearnOS clients. For MVP, use mock users stored in the database (or even hardcoded). The architecture must be OAuth/OIDC-compatible for future SSO integration.

## Context (from LearnOS Product Document)
> "Authentication, roles, tenant boundaries, consent and device registration"
> "OAuth/OIDC-compatible identity; role-based access control"

---

## Roles in the System

| Role | Description | Permissions |
|------|-------------|------------|
| **learner** | Student aged 10–16 | Read own session plan, own Twin data; write session events, reflections |
| **mentor** | Coach/teacher at the learning centre | Read assigned learners' Twins and events; write mentor notes; approve escalations |
| **parent** | Guardian of a learner | Read weekly report for their child only; no session access |
| **admin** | Centre/school admin | Full tenant access; manage users, devices, curriculum config |
| **superadmin** | LearnOS operator | Cross-tenant access for monitoring |

---

## MVP Features to Build

### 1. User Registration / Provisioning
- Admin creates learner, mentor, and parent accounts (no self-registration in MVP)
- Each user belongs to a **tenant** (learning centre)
- Fields: `id`, `email`, `name`, `role`, `tenant_id`, `guardian_id` (for learner→parent link), `curriculum_id`, `created_at`

### 2. Login API
```
POST /auth/login
Body: { "username": "ahmed@centre1.learnos", "password": "..." }
Response: { "access_token": "JWT", "refresh_token": "...", "role": "learner", "learner_id": "..." }
```

### 3. Token Refresh
```
POST /auth/refresh
Body: { "refresh_token": "..." }
Response: { "access_token": "JWT" }
```

### 4. Logout
```
POST /auth/logout
Headers: Authorization: Bearer <token>
```
Invalidates refresh token.

### 5. Device Registration (MVP: simplified)
- Endpoint to register a device (Windows client) with a tenant
- Device gets a device token used in session telemetry
```
POST /auth/device/register
Body: { "device_name": "Room 1 PC", "tenant_id": "centre-1" }
Response: { "device_id": "...", "device_token": "..." }
```

### 6. Role-Based Access Control (RBAC)
- JWT payload includes: `sub` (user ID), `role`, `tenant_id`
- All API services validate JWT and check role before serving data
- Middleware: `requireRole(['mentor', 'admin'])`

### 7. Consent Tracking (MVP: basic)
- Store guardian consent record per learner
- Fields: `learner_id`, `guardian_id`, `consented_at`, `data_scope` (what data is collected)
- Required before learner can start first session

---

## Database Schema (MVP)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('learner','mentor','parent','admin','superadmin')),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants (learning centres / schools)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'learning_centre',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learner profiles (extends users)
CREATE TABLE learner_profiles (
  learner_id UUID PRIMARY KEY REFERENCES users(id),
  guardian_id UUID REFERENCES users(id),
  grade VARCHAR(50),
  curriculum_id UUID,
  date_of_birth DATE,
  consent_given BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMPTZ
);

-- Devices
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  tenant_id UUID REFERENCES tenants(id),
  device_token VARCHAR(512) UNIQUE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(512) UNIQUE,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);
```

---

## Mock Data (MVP Seed)

```sql
-- Seed tenant
INSERT INTO tenants (id, name) VALUES ('tenant-001', 'LearnOS Pilot Centre');

-- Seed users
INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES
('learner-001', 'ahmed@pilot.learnos', '<bcrypt_hash_of_1234>', 'Ahmed Khan', 'learner', 'tenant-001'),
('learner-002', 'sara@pilot.learnos', '<bcrypt_hash_of_1234>', 'Sara Malik', 'learner', 'tenant-001'),
('mentor-001', 'coach@pilot.learnos', '<bcrypt_hash_of_password>', 'Ms. Nadia', 'mentor', 'tenant-001'),
('parent-001', 'parent@pilot.learnos', '<bcrypt_hash_of_password>', 'Mr. Khan Sr.', 'parent', 'tenant-001'),
('admin-001', 'admin@pilot.learnos', '<bcrypt_hash_of_admin123>', 'Admin User', 'admin', 'tenant-001');

-- Seed learner profiles
INSERT INTO learner_profiles (learner_id, guardian_id, grade, consent_given, consent_given_at) VALUES
('learner-001', 'parent-001', 'Grade 6', true, NOW()),
('learner-002', 'parent-001', 'Grade 7', true, NOW());
```

---

## API Endpoints Summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Authenticate user |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | Authenticated | Invalidate token |
| POST | `/auth/device/register` | admin | Register a device |
| GET | `/auth/me` | Authenticated | Get current user info |
| POST | `/admin/users` | admin | Create a new user |
| GET | `/admin/users` | admin | List users in tenant |
| PATCH | `/admin/users/:id` | admin | Update user |
| POST | `/admin/consent/:learner_id` | admin/parent | Record consent |

---

## Tech Stack
- **Runtime**: Node.js (Express) or Python (FastAPI)
- **Auth**: JWT (access: 15 min expiry), Refresh tokens (7-day expiry, stored in DB)
- **Password hashing**: bcrypt (12 rounds)
- **DB**: PostgreSQL
- **Session management**: Stateless (JWT) + refresh token rotation

---

## Acceptance Criteria

- [ ] Login endpoint returns valid JWT for seeded users
- [ ] JWT contains correct `role`, `tenant_id`, `sub`
- [ ] Token refresh works and rotates refresh token
- [ ] Protected endpoints reject requests without valid token
- [ ] Role middleware correctly gates mentor/admin routes from learner role
- [ ] Device registration endpoint creates device with unique token
- [ ] Mock seed data creates all 5 user types successfully
- [ ] Consent record can be created and read

---

## Security Requirements (MVP Minimum)
- Passwords hashed with bcrypt, never stored plain
- HTTPS only (even in development, use self-signed cert)
- JWT signed with HS256 minimum (RS256 preferred)
- No sensitive data in JWT payload (no PII beyond user ID)
- Refresh tokens are single-use (rotation)
- Audit log entry on every login/logout

---

## Dependencies
- **TASK-05**: Core Services API (uses auth middleware)
- **TASK-01**: Windows Client (calls login endpoint)
- **TASK-09**: Mentor Dashboard (uses mentor JWT)
- **TASK-10**: Parent Report (uses parent JWT)

---

## Notes for LLM Agent
- Use `jsonwebtoken` (Node) or `python-jose` (FastAPI) for JWT
- Use `bcryptjs` or `bcrypt` for password hashing
- Create a reusable middleware: `authMiddleware(requiredRoles: string[])`
- For MVP: no external identity provider needed — own user store is sufficient
- Write integration tests for all auth flows
- All endpoints must return consistent error format: `{ "error": "...", "code": "..." }`
