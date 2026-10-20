"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategoryType = exports.createCategoryType = exports.updateCategory = exports.createCategory = exports.getCategoryBrands = exports.getCategoryTypes = exports.getCategoryById = exports.getCategories = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Category name is required'),
    slug: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
    navigationType: zod_1.z.enum(['type_first', 'brand_first']).default('brand_first'),
    sortOrder: zod_1.z.number().optional().default(0),
    isActive: zod_1.z.boolean().optional().default(true),
});
const categoryTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Type name is required'),
    slug: zod_1.z.string().min(1, 'Slug is required'),
    description: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().optional().default(0),
    isActive: zod_1.z.boolean().optional().default(true),
});
const getCategories = async (req, res, next) => {
    try {
        const categories = await db_1.default.category.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
                types: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' }
                },
                _count: {
                    select: { models: true, types: true },
                },
            },
        });
        res.status(200).json({ success: true, data: categories });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const getCategoryById = async (req, res, next) => {
    try {
        const rawId = String(req.params.id);
        const isNum = /^\d+$/.test(rawId);
        const category = await db_1.default.category.findFirst({
            where: isNum ? { id: parseInt(rawId, 10) } : { slug: rawId },
            include: {
                types: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' }
                },
                _count: {
                    select: { models: true, types: true }
                }
            }
        });
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        res.status(200).json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategoryById = getCategoryById;
const getCategoryTypes = async (req, res, next) => {
    try {
        const rawId = String(req.params.id);
        const isNum = /^\d+$/.test(rawId);
        const category = await db_1.default.category.findFirst({
            where: isNum ? { id: parseInt(rawId, 10) } : { slug: rawId }
        });
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        const types = await db_1.default.categoryType.findMany({
            where: { categoryId: category.id, isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { models: true }
                }
            }
        });
        res.status(200).json({ success: true, category, data: types });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategoryTypes = getCategoryTypes;
const getCategoryBrands = async (req, res, next) => {
    try {
        const rawId = String(req.params.id);
        const typeIdParam = req.query.typeId;
        const isNum = /^\d+$/.test(rawId);
        const category = await db_1.default.category.findFirst({
            where: isNum ? { id: parseInt(rawId, 10) } : { slug: rawId }
        });
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        const typeId = typeIdParam ? parseInt(typeIdParam, 10) : undefined;
        // Fetch all brands that have models in this category (and type if specified)
        const brandsWithModels = await db_1.default.brand.findMany({
            where: {
                isActive: true,
                models: {
                    some: {
                        categoryId: category.id,
                        ...(typeId ? { typeId } : {})
                    }
                }
            },
            include: {
                models: {
                    where: {
                        categoryId: category.id,
                        ...(typeId ? { typeId } : {})
                    },
                    select: { id: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        // Also get all active brands so technician can see brands with 0 count or filtered
        const allBrands = await db_1.default.brand.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        const modelCountMap = {};
        for (const b of brandsWithModels) {
            modelCountMap[b.id] = b.models.length;
        }
        const formattedBrands = allBrands.map(b => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            logoUrl: b.logoUrl,
            modelCount: modelCountMap[b.id] || 0
        }));
        res.status(200).json({
            success: true,
            category,
            typeId: typeId || null,
            data: formattedBrands
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategoryBrands = getCategoryBrands;
const createCategory = async (req, res, next) => {
    try {
        const validatedData = categorySchema.parse(req.body);
        const slug = validatedData.slug || validatedData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const existingCategory = await db_1.default.category.findFirst({
            where: { OR: [{ name: validatedData.name }, { slug }] }
        });
        if (existingCategory) {
            res.status(400).json({ success: false, message: 'Category name or slug already exists' });
            return;
        }
        const category = await db_1.default.category.create({
            data: {
                ...validatedData,
                slug
            }
        });
        await db_1.default.auditLog.create({
            data: {
                userId: req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10)) : null,
                action: 'CREATE_CATEGORY',
                resource: 'categories',
                details: `Created category: ${category.name} (${category.slug})`
            }
        });
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res, next) => {
    try {
        const categoryId = parseInt(String(req.params.id), 10);
        const validatedData = categorySchema.partial().parse(req.body);
        const category = await db_1.default.category.update({
            where: { id: categoryId },
            data: validatedData,
        });
        res.status(200).json({ success: true, data: category });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.updateCategory = updateCategory;
const createCategoryType = async (req, res, next) => {
    try {
        const categoryId = parseInt(String(req.params.id), 10);
        const validatedData = categoryTypeSchema.parse(req.body);
        const newType = await db_1.default.categoryType.create({
            data: {
                categoryId,
                ...validatedData
            }
        });
        res.status(201).json({ success: true, data: newType });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.createCategoryType = createCategoryType;
const updateCategoryType = async (req, res, next) => {
    try {
        const typeId = parseInt(String(req.params.typeId), 10);
        const validatedData = categoryTypeSchema.partial().parse(req.body);
        const updatedType = await db_1.default.categoryType.update({
            where: { id: typeId },
            data: validatedData
        });
        res.status(200).json({ success: true, data: updatedType });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.updateCategoryType = updateCategoryType;
const deleteCategory = async (req, res, next) => {
    try {
        const categoryId = parseInt(String(req.params.id), 10);
        // Soft delete / deactivate
        await db_1.default.category.update({
            where: { id: categoryId },
            data: { isActive: false }
        });
        res.status(200).json({ success: true, message: 'Category deactivated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCategory = deleteCategory;
