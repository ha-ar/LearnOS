"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const admin_routes_js_1 = __importDefault(require("./routes/admin.routes.js"));
const resource_routes_js_1 = __importDefault(require("./routes/resource.routes.js"));
const twin_routes_js_1 = __importDefault(require("./routes/twin.routes.js"));
const event_routes_js_1 = __importDefault(require("./routes/event.routes.js"));
const safety_routes_js_1 = __importDefault(require("./routes/safety.routes.js"));
const session_routes_js_1 = __importDefault(require("./routes/session.routes.js"));
const recommendation_routes_js_1 = __importDefault(require("./routes/recommendation.routes.js"));
const mentor_routes_js_1 = __importDefault(require("./routes/mentor.routes.js"));
const report_routes_js_1 = __importDefault(require("./routes/report.routes.js"));
const ai_routes_js_1 = __importDefault(require("./routes/ai.routes.js"));
exports.app = (0, express_1.default)();
// Global Middlewares
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
// Health Check Endpoint
exports.app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'learnos-backend', timestamp: new Date().toISOString() });
});
// API Routes (Mounted under /api/ and / for compatibility)
exports.app.use('/api/auth', auth_routes_js_1.default);
exports.app.use('/api/admin', admin_routes_js_1.default);
exports.app.use('/api/resources', resource_routes_js_1.default);
exports.app.use('/api/twin', twin_routes_js_1.default);
exports.app.use('/api/events', event_routes_js_1.default);
exports.app.use('/events', event_routes_js_1.default); // Direct root endpoint alias per TASK-07 spec
exports.app.use('/api/safety', safety_routes_js_1.default);
exports.app.use('/api/sessions', session_routes_js_1.default);
exports.app.use('/api/recommendations', recommendation_routes_js_1.default);
exports.app.use('/api/mentor', mentor_routes_js_1.default);
exports.app.use('/api/reports', report_routes_js_1.default);
exports.app.use('/reports', report_routes_js_1.default);
exports.app.use('/api/ai', ai_routes_js_1.default);
// Global 404 Handler
exports.app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' });
});
// Global Error Handler
exports.app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
});
exports.default = exports.app;
