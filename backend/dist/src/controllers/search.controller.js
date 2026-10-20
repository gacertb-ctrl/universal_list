"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingSearches = exports.getSuggestions = exports.searchModels = void 0;
const db_1 = __importDefault(require("../config/db"));
const searchModels = async (req, res, next) => {
    try {
        const query = (req.query.q || req.query.query);
        if (!query || query.trim().length < 2) {
            res.status(200).json({ success: true, data: [] });
            return;
        }
        const q = query.trim();
        // MySQL search across model name, brand name, category name, aliases, compatibility lists
        const models = await db_1.default.model.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: q } },
                    { brand: { name: { contains: q } } },
                    { category: { name: { contains: q } } },
                    { aliases: { some: { aliasName: { contains: q } } } },
                    { compatibilityLists: { some: { compatibleWith: { contains: q } } } },
                    { tags: { some: { tagName: { contains: q } } } }
                ]
            },
            include: {
                brand: true,
                category: true,
                categoryType: true,
                aliases: true,
                tags: true,
                compatibilityLists: true,
            },
            take: 25,
            orderBy: [{ isVerified: 'desc' }, { updatedAt: 'desc' }]
        });
        // Asynchronously log search history for authenticated users
        if (req.user) {
            const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10);
            db_1.default.searchHistory.create({
                data: { userId, query: q }
            }).catch(console.error);
        }
        // Increment keyword search count
        db_1.default.searchKeyword.upsert({
            where: { keyword: q.toLowerCase() },
            update: { count: { increment: 1 } },
            create: { keyword: q.toLowerCase(), count: 1 }
        }).catch(console.error);
        res.status(200).json({ success: true, query: q, data: models });
    }
    catch (error) {
        next(error);
    }
};
exports.searchModels = searchModels;
const getSuggestions = async (req, res, next) => {
    try {
        const query = (req.query.q || req.query.query);
        if (!query || query.trim().length < 2) {
            res.status(200).json({ success: true, data: [] });
            return;
        }
        const q = query.trim();
        const [matchingModels, matchingBrands, matchingCategories] = await Promise.all([
            db_1.default.model.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: q } },
                        { aliases: { some: { aliasName: { contains: q } } } },
                        { compatibilityLists: { some: { compatibleWith: { contains: q } } } }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    brand: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true, slug: true, navigationType: true } },
                    categoryType: { select: { id: true, name: true } },
                    isVerified: true
                },
                take: 8
            }),
            db_1.default.brand.findMany({
                where: { isActive: true, name: { contains: q } },
                select: { id: true, name: true, logoUrl: true },
                take: 3
            }),
            db_1.default.category.findMany({
                where: { isActive: true, name: { contains: q } },
                select: { id: true, name: true, slug: true, navigationType: true },
                take: 3
            })
        ]);
        res.status(200).json({
            success: true,
            query: q,
            data: matchingModels,
            brands: matchingBrands,
            categories: matchingCategories
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSuggestions = getSuggestions;
const getTrendingSearches = async (req, res, next) => {
    try {
        const trending = await db_1.default.searchKeyword.findMany({
            orderBy: { count: 'desc' },
            take: 10
        });
        res.status(200).json({ success: true, data: trending });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrendingSearches = getTrendingSearches;
