"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect ALL admin routes with Super Admin and Admin roles
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)(['Super Admin', 'Admin']));
// Dashboard metrics
router.get('/dashboard', admin_controller_1.getAdminDashboardMetrics);
// User Management
router.get('/users', admin_controller_1.getUsers);
router.patch('/users/:id/status', admin_controller_1.updateUserStatus);
router.patch('/users/:id/role', admin_controller_1.updateUserRole);
// Gemini AI Management
router.get('/ai/jobs', admin_controller_1.getAiJobs);
router.post('/ai/jobs/run', admin_controller_1.runAiJob);
router.get('/ai/candidates', admin_controller_1.getAiCandidates);
router.post('/ai/candidates/:id/approve', admin_controller_1.approveAiCandidate);
router.post('/ai/candidates/:id/reject', admin_controller_1.rejectAiCandidate);
router.get('/ai/settings', admin_controller_1.getAiSettings);
router.put('/ai/settings', admin_controller_1.updateAiSettings);
router.get('/ai/models', admin_controller_1.getAvailableGeminiModels);
// Audit logs
router.get('/audit-logs', admin_controller_1.getAuditLogs);
exports.default = router;
