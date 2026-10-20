import { Router } from 'express';
import {
  getAdminDashboardMetrics,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getAiJobs,
  runAiJob,
  getAiCandidates,
  approveAiCandidate,
  rejectAiCandidate,
  getAiSettings,
  updateAiSettings,
  getAvailableGeminiModels,
  getAuditLogs
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Protect ALL admin routes with Super Admin and Admin roles
router.use(authenticate);
router.use(authorize(['Super Admin', 'Admin']));

// Dashboard metrics
router.get('/dashboard', getAdminDashboardMetrics);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);

// Gemini AI Management
router.get('/ai/jobs', getAiJobs);
router.post('/ai/jobs/run', runAiJob);
router.get('/ai/candidates', getAiCandidates);
router.post('/ai/candidates/:id/approve', approveAiCandidate);
router.post('/ai/candidates/:id/reject', rejectAiCandidate);
router.get('/ai/settings', getAiSettings);
router.put('/ai/settings', updateAiSettings);
router.get('/ai/models', getAvailableGeminiModels);

// Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
