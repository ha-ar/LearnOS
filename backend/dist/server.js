"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_js_1 = require("./app.js");
const index_js_1 = require("./db/index.js");
dotenv_1.default.config();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const server = app_js_1.app.listen(PORT, HOST, () => {
    console.log(`🚀 LearnOS Backend API running at http://${HOST}:${PORT}`);
});
// Graceful shutdown handling
const gracefulShutdown = async () => {
    console.log('Shutting down LearnOS Backend Service...');
    server.close(async () => {
        await index_js_1.pool.end();
        console.log('Database pool closed. Exiting process.');
        process.exit(0);
    });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
