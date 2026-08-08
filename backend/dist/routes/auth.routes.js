"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Public routes
router.post('/login', auth_controller_js_1.AuthController.login);
router.post('/register', auth_controller_js_1.AuthController.register);
router.post('/refresh', auth_controller_js_1.AuthController.refresh);
// Protected routes
router.post('/logout', auth_js_1.authenticateToken, auth_controller_js_1.AuthController.logout);
router.get('/me', auth_js_1.authenticateToken, auth_controller_js_1.AuthController.me);
// Device registration (Admin only)
router.post('/device/register', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)(['admin', 'superadmin']), auth_controller_js_1.AuthController.registerDevice);
exports.default = router;
