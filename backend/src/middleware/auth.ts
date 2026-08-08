import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload, UserRole } from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';

/**
 * Middleware: Verify Bearer JWT Access Token
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      error: 'Authentication token required',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Invalid or expired authentication token',
      code: 'INVALID_TOKEN',
    });
    return;
  }
};

/**
 * Middleware: Gate endpoints by user roles (RBAC)
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Role '${req.user.role}' is not authorized to perform this action`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
};
