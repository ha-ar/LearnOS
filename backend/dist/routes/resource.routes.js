"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resource_controller_js_1 = require("../controllers/resource.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All resource routes require valid authentication
router.use(auth_js_1.authenticateToken);
router.get('/', resource_controller_js_1.ResourceController.searchResources);
router.post('/select', resource_controller_js_1.ResourceController.selectBestResource);
router.get('/providers', resource_controller_js_1.ResourceController.listProviders);
router.get('/:id', resource_controller_js_1.ResourceController.getResourceById);
router.get('/:id/quiz', resource_controller_js_1.ResourceController.getQuizQuestions);
router.post('/:id/quiz/submit', resource_controller_js_1.ResourceController.submitQuiz);
exports.default = router;
