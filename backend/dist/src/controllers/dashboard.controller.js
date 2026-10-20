"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentUpdates = exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../config/db"));
const getDashboardStats = async (req, res, next) => {
    try {
        const [totalModels, totalBrands, totalCategories, verifiedModels, totalCompatibilities, pendingAiCandidates, totalUsers] = await Promise.all([
            db_1.default.model.count({ where: { isActive: true } }),
            db_1.default.brand.count({ where: { isActive: true } }),
            db_1.default.category.count({ where: { isActive: true } }),
            db_1.default.model.count({ where: { isActive: true, isVerified: true } }),
            db_1.default.compatibilityList.count(),
            db_1.default.aiUpdateCandidate.count({ where: { verificationStatus: 'unverified' } }),
            db_1.default.user.count()
        ]);
        // Category breakdown
        const categoriesRaw = await db_1.default.category.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { models: true, types: true }
                }
            },
            orderBy: { sortOrder: 'asc' }
        });
        const categories = categoriesRaw.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            navigationType: c.navigationType,
            modelCount: c._count.models,
            typeCount: c._count.types
        }));
        // Top trending search keywords
        const trendingSearches = await db_1.default.searchKeyword.findMany({
            orderBy: { count: 'desc' },
            take: 6
        });
        res.status(200).json({
            success: true,
            data: {
                totalModels,
                totalBrands,
                totalCategories,
                verifiedModels,
                totalCompatibilities,
                pendingAiCandidates,
                totalUsers,
                verifiedPercentage: totalModels > 0 ? Math.round((verifiedModels / totalModels) * 100) : 0,
                categories,
                trendingSearches: trendingSearches.map(t => t.keyword)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
const getRecentUpdates = async (req, res, next) => {
    try {
        // Fetch latest 10 models added or updated from MySQL
        const recentModels = await db_1.default.model.findMany({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
            include: {
                brand: true,
                category: true,
                categoryType: true,
                compatibilityLists: true
            },
            take: 10
        });
        const updates = recentModels.map(m => {
            const dateStr = m.updatedAt.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const typePrefix = m.categoryType ? `[${m.categoryType.name}] ` : '';
            const compatCount = m.compatibilityLists.length;
            return {
                id: m.id,
                date: dateStr,
                title: `${m.brand.name} ${m.name} ${typePrefix}${m.category.name} List Add`,
                modelId: m.id,
                brandId: m.brandId,
                categoryId: m.categoryId,
                compatCount,
                isVerified: m.isVerified,
                status: m.isVerified ? 'Verified' : 'New'
            };
        });
        res.status(200).json({
            success: true,
            data: updates
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRecentUpdates = getRecentUpdates;
