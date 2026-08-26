"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestions = exports.getTrendingSearches = exports.searchModels = void 0;
const db_1 = __importDefault(require("../config/db"));
const searchModels = async (req, res, next) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            res.status(200).json({ success: true, data: [] });
            return;
        }
        // Advanced search using Prisma OR
        // We are searching in model name, brand name, category name, aliases, and tags
        const models = await db_1.default.model.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { brand: { name: { contains: query, mode: 'insensitive' } } },
                    { category: { name: { contains: query, mode: 'insensitive' } } },
                    { aliases: { some: { aliasName: { contains: query, mode: 'insensitive' } } } },
                    { tags: { some: { tagName: { contains: query, mode: 'insensitive' } } } },
                    { compatibilityLists: { some: { compatibleWith: { contains: query, mode: 'insensitive' } } } }
                ]
            },
            include: {
                brand: true,
                category: true,
                aliases: true,
                tags: true,
                compatibilityLists: true,
            },
            take: 20 // Limit for auto-suggest
        });
        // Log the search history if user is authenticated (Optional but good for analytics)
        if (req.user) {
            // Run asynchronously without waiting
            db_1.default.searchHistory.create({
                data: {
                    userId: req.user.id,
                    query: query
                }
            }).catch(console.error);
        }
        // Update keyword search count
        db_1.default.searchKeyword.upsert({
            where: { keyword: query.toLowerCase() },
            update: { count: { increment: 1 } },
            create: { keyword: query.toLowerCase(), count: 1 }
        }).catch(console.error);
        res.status(200).json({ success: true, data: models });
    }
    catch (error) {
        next(error);
    }
};
exports.searchModels = searchModels;
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
const getSuggestions = async (req, res, next) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            res.status(200).json({ success: true, data: [] });
            return;
        }
        const suggestions = await db_1.default.model.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { brand: { name: { contains: query, mode: 'insensitive' } } },
                    { category: { name: { contains: query, mode: 'insensitive' } } },
                    { aliases: { some: { aliasName: { contains: query, mode: 'insensitive' } } } }
                ]
            },
            select: {
                id: true,
                name: true,
                brand: { select: { name: true } },
                category: { select: { name: true } }
            },
            take: 10
        });
        res.status(200).json({ success: true, data: suggestions });
    }
    catch (error) {
        next(error);
    }
};
exports.getSuggestions = getSuggestions;
