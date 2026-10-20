"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.updateAiSettings = exports.getAvailableGeminiModels = exports.getAiSettings = exports.rejectAiCandidate = exports.approveAiCandidate = exports.getAiCandidates = exports.runAiJob = exports.getAiJobs = exports.updateUserRole = exports.updateUserStatus = exports.getUsers = exports.getAdminDashboardMetrics = void 0;
const db_1 = __importDefault(require("../config/db"));
const aiUpdate_service_1 = require("../services/aiUpdate.service");
const aiScheduler_1 = require("../jobs/aiScheduler");
const getAdminDashboardMetrics = async (req, res, next) => {
    try {
        const [totalCategories, totalBrands, totalModels, verifiedModels, totalCompatibilities, pendingAiCandidates, totalAiJobs, failedAiJobs, totalUsers, recentAuditLogs] = await Promise.all([
            db_1.default.category.count(),
            db_1.default.brand.count(),
            db_1.default.model.count(),
            db_1.default.model.count({ where: { isVerified: true } }),
            db_1.default.compatibilityList.count(),
            db_1.default.aiUpdateCandidate.count({ where: { verificationStatus: 'unverified' } }),
            db_1.default.aiUpdateJob.count(),
            db_1.default.aiUpdateJob.count({ where: { status: 'failed' } }),
            db_1.default.user.count(),
            db_1.default.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { user: { select: { name: true, email: true } } }
            })
        ]);
        res.status(200).json({
            success: true,
            data: {
                totalCategories,
                totalBrands,
                totalModels,
                verifiedModels,
                totalCompatibilities,
                pendingAiCandidates,
                totalAiJobs,
                failedAiJobs,
                totalUsers,
                recentAuditLogs
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminDashboardMetrics = getAdminDashboardMetrics;
// ========================
// USER MANAGEMENT
// ========================
const getUsers = async (req, res, next) => {
    try {
        const users = await db_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                role: { select: { id: true, name: true } },
                lastLogin: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        const roles = await db_1.default.role.findMany({
            select: { id: true, name: true }
        });
        res.status(200).json({ success: true, data: users, roles });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const updateUserStatus = async (req, res, next) => {
    try {
        const userId = parseInt(String(req.params.id), 10);
        const { status } = req.body;
        if (!['active', 'suspended'].includes(status)) {
            res.status(400).json({ success: false, message: 'Invalid status. Must be active or suspended.' });
            return;
        }
        const updatedUser = await db_1.default.user.update({
            where: { id: userId },
            data: { status }
        });
        await db_1.default.auditLog.create({
            data: {
                userId: req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10)) : null,
                action: 'UPDATE_USER_STATUS',
                resource: 'users',
                details: `Updated user #${userId} status to ${status}`
            }
        });
        res.status(200).json({ success: true, data: updatedUser });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUserStatus = updateUserStatus;
const updateUserRole = async (req, res, next) => {
    try {
        const userId = parseInt(String(req.params.id), 10);
        const { roleId } = req.body;
        const role = await db_1.default.role.findUnique({ where: { id: parseInt(roleId, 10) } });
        if (!role) {
            res.status(400).json({ success: false, message: 'Role not found' });
            return;
        }
        const updatedUser = await db_1.default.user.update({
            where: { id: userId },
            data: { roleId: role.id }
        });
        res.status(200).json({ success: true, data: updatedUser });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUserRole = updateUserRole;
// ========================
// GEMINI AI MANAGEMENT
// ========================
const getAiJobs = async (req, res, next) => {
    try {
        const jobs = await db_1.default.aiUpdateJob.findMany({
            orderBy: { startedAt: 'desc' },
            take: 20,
            include: {
                _count: {
                    select: { candidates: true }
                }
            }
        });
        res.status(200).json({ success: true, data: jobs });
    }
    catch (error) {
        next(error);
    }
};
exports.getAiJobs = getAiJobs;
const runAiJob = async (req, res, next) => {
    try {
        const { isDryRun } = req.body;
        const adminUserId = req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10)) : undefined;
        const result = await aiScheduler_1.aiScheduler.runNow({
            isDryRun: isDryRun ?? false,
            adminUserId
        });
        res.status(200).json({
            success: true,
            message: `AI Update Job ${result.job.jobId} completed successfully. Found ${result.candidates.length} candidates.`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'AI Update job failed' });
    }
};
exports.runAiJob = runAiJob;
const getAiCandidates = async (req, res, next) => {
    try {
        const status = req.query.status;
        const jobId = req.query.jobId;
        const where = {};
        if (status)
            where.verificationStatus = status;
        if (jobId)
            where.jobId = parseInt(jobId, 10);
        const candidates = await db_1.default.aiUpdateCandidate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                job: true
            }
        });
        res.status(200).json({ success: true, data: candidates });
    }
    catch (error) {
        next(error);
    }
};
exports.getAiCandidates = getAiCandidates;
const approveAiCandidate = async (req, res, next) => {
    try {
        const candidateId = parseInt(String(req.params.id), 10);
        const adminUserId = req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10)) : 1;
        const result = await aiUpdate_service_1.GeminiModelUpdateService.approveCandidate(candidateId, adminUserId);
        res.status(200).json({
            success: true,
            message: 'Candidate approved and model compatibility records applied in MySQL transaction.',
            data: result
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Approval failed' });
    }
};
exports.approveAiCandidate = approveAiCandidate;
const rejectAiCandidate = async (req, res, next) => {
    try {
        const candidateId = parseInt(String(req.params.id), 10);
        const { reason } = req.body;
        const adminUserId = req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10)) : 1;
        const result = await aiUpdate_service_1.GeminiModelUpdateService.rejectCandidate(candidateId, adminUserId, reason);
        res.status(200).json({
            success: true,
            message: 'Candidate marked as rejected.',
            data: result
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Rejection failed' });
    }
};
exports.rejectAiCandidate = rejectAiCandidate;
const getAiSettings = async (req, res, next) => {
    try {
        const settings = await db_1.default.aiSetting.findMany();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        const isApiKeyConfigured = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
        const schedulerStatus = aiScheduler_1.aiScheduler.getStatus();
        res.status(200).json({
            success: true,
            data: settingsMap,
            isApiKeyConfigured,
            activeScheduler: schedulerStatus
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAiSettings = getAiSettings;
const getAvailableGeminiModels = async (req, res, next) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(200).json({
                success: true,
                data: [
                    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'Free', tierBadge: 'Free Tier', description: 'Recommended: High speed, low latency multimodal text generation model.' },
                    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', tier: 'Free', tierBadge: 'Free Tier', description: 'Cost-effective high-throughput model.' },
                    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'Paid', tierBadge: 'Paid Tier', description: 'Advanced reasoning, high token capacity for complex compatibility tasks.' },
                    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'Free', tierBadge: 'Free Tier', description: 'Fast automated discovery model.' }
                ]
            });
            return;
        }
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`Google API returned status ${response.status}`);
        }
        const result = await response.json();
        const rawModels = result.models || [];
        // Filter strictly for text/content generation models (exclude tts, audio, image-generation, clip, embedding, etc.)
        const nonTextKeywords = ['image', 'banana', 'tts', 'audio', 'clip', 'transcribe', 'embedding', 'robotics', 'computer-use'];
        const models = rawModels
            .filter((m) => {
            const idLower = (m.name || '').toLowerCase();
            const displayLower = (m.displayName || '').toLowerCase();
            const isNonText = nonTextKeywords.some((kw) => idLower.includes(kw) || displayLower.includes(kw));
            return !isNonText && m.supportedGenerationMethods?.includes('generateContent');
        })
            .map((m) => {
            const id = m.name.replace(/^models\//, '');
            const idLower = id.toLowerCase();
            const displayLower = (m.displayName || '').toLowerCase();
            // In Google AI Studio:
            // Free tier available: Flash, Flash-Lite, Gemma, and standard previews within rate limits (15 RPM / 1M TPM)
            // Paid / Pay-as-you-go: Pro models (gemini-*-pro), Deep Research, Ultra/Argon models
            const isPaid = idLower.includes('pro') ||
                idLower.includes('deep-research') ||
                idLower.includes('argon') ||
                displayLower.includes('pro');
            const tier = isPaid ? 'Paid' : 'Free';
            const tierBadge = isPaid ? 'Paid Tier' : 'Free Tier';
            return {
                id,
                name: m.displayName || id,
                tier,
                tierBadge,
                description: m.description,
                inputTokenLimit: m.inputTokenLimit,
                outputTokenLimit: m.outputTokenLimit
            };
        });
        res.status(200).json({ success: true, data: models });
    }
    catch (error) {
        res.status(200).json({
            success: true,
            data: [
                { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'Free', tierBadge: 'Free Tier', description: 'Recommended: High speed text generation model.' },
                { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', tier: 'Free', tierBadge: 'Free Tier', description: 'Lightweight free model.' },
                { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'Paid', tierBadge: 'Paid Tier', description: 'Complex reasoning pro model.' },
                { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'Free', tierBadge: 'Free Tier', description: 'Fast automated discovery model.' }
            ],
            warning: error.message
        });
    }
};
exports.getAvailableGeminiModels = getAvailableGeminiModels;
const updateAiSettings = async (req, res, next) => {
    try {
        const settingsData = req.body; // { key: value }
        for (const [key, value] of Object.entries(settingsData)) {
            if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
                await db_1.default.aiSetting.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) }
                });
            }
        }
        // Re-initialize scheduler with new settings
        await aiScheduler_1.aiScheduler.initialize();
        res.status(200).json({ success: true, message: 'AI settings updated successfully.' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAiSettings = updateAiSettings;
const getAuditLogs = async (req, res, next) => {
    try {
        const logs = await db_1.default.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });
        res.status(200).json({ success: true, data: logs });
    }
    catch (error) {
        next(error);
    }
};
exports.getAuditLogs = getAuditLogs;
