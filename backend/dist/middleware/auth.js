"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';
/**
 * Middleware: Verify Bearer JWT Access Token
 */
const authenticateToken = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({
            error: 'Invalid or expired authentication token',
            code: 'INVALID_TOKEN',
        });
        return;
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware: Gate endpoints by user roles (RBAC)
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
