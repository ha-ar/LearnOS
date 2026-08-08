import { Request } from 'express';

export type UserRole = 'learner' | 'mentor' | 'parent' | 'admin' | 'superadmin';

export interface JwtPayload {
  sub: string;         // User ID
  email: string;
  role: UserRole;
  tenant_id: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  tenant_id: string;
  is_active: boolean;
  created_at: Date;
}
