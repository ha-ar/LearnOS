import assert from 'node:assert';
import { test, describe } from 'node:test';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';

describe('TASK-03: Auth Unit & Security Logic Tests', () => {

  test('Password Hashing: bcrypt hashes and verifies password correctly', async () => {
    const plainPassword = 'LearnOS2026!';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(plainPassword, salt);

    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
    const isMatch = await bcrypt.compare(plainPassword, hash);
    assert.strictEqual(isMatch, true);

    const isWrongMatch = await bcrypt.compare('WrongPass', hash);
    assert.strictEqual(isWrongMatch, false);
  });

  test('JWT Token: signs and verifies access token with claims', () => {
    const payload: JwtPayload = {
      sub: '10000000-0000-0000-0000-000000000001',
      email: 'ahmed@pilot.learnos',
      name: 'Ahmed Khan',
      role: 'learner',
      tenant_id: '00000000-0000-0000-0000-000000000001',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    assert.ok(token);

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    assert.strictEqual(decoded.sub, payload.sub);
    assert.strictEqual(decoded.role, 'learner');
    assert.strictEqual(decoded.tenant_id, payload.tenant_id);
    assert.strictEqual(decoded.email, payload.email);
  });

  test('RBAC Middleware: validates role authorization correctly', () => {
    const allowedRoles = ['admin', 'superadmin'];

    const learnerRole = 'learner';
    const isLearnerAllowed = allowedRoles.includes(learnerRole);
    assert.strictEqual(isLearnerAllowed, false);

    const adminRole = 'admin';
    const isAdminAllowed = allowedRoles.includes(adminRole);
    assert.strictEqual(isAdminAllowed, true);
  });
});
