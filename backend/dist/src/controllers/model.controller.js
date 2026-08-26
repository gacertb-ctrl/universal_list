"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestModel = exports.bulkImportModels = exports.deleteModel = exports.updateModel = exports.createModel = exports.getModelById = exports.getModels = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const modelSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Model name is required"),
    brandId: zod_1.z.string().min(1, "Brand ID is required"),
    categoryId: zod_1.z.string().min(1, "Category ID is required"),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().optional(),
    isVerified: zod_1.z.boolean().optional(),
    aliases: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    compatibilityLists: zod_1.z.array(zod_1.z.object({
        compatibleWith: zod_1.z.string().min(1),
        connectorType: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(),
    })).optional()
});
const getModels = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        // Filtering
        const brandId = req.query.brandId || undefined;
        const categoryId = req.query.categoryId || undefined;
        const whereClause = {};
        if (brandId)
            whereClause.brandId = brandId;
        if (categoryId)
            whereClause.categoryId = categoryId;
        const [models, total] = await Promise.all([
            db_1.default.model.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    brand: true,
                    category: true,
                    aliases: true,
                    tags: true,
                    compatibilityLists: true,
                },
                orderBy: { updatedAt: 'desc' }
            }),
            db_1.default.model.count({ where: whereClause })
        ]);
        res.status(200).json({
            success: true,
            data: models,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getModels = getModels;
const getModelById = async (req, res, next) => {
    try {
        const modelId = req.params.id;
        const model = await db_1.default.model.findUnique({
            where: { id: modelId },
            include: {
                brand: true,
                category: true,
                aliases: true,
                tags: true,
                compatibilityLists: true,
            }
        });
        if (!model) {
            res.status(404).json({ success: false, message: 'Model not found' });
            return;
        }
        res.status(200).json({ success: true, data: model });
    }
    catch (error) {
        next(error);
    }
};
exports.getModelById = getModelById;
const createModel = async (req, res, next) => {
    try {
        const validatedData = modelSchema.parse(req.body);
        const model = await db_1.default.model.create({
            data: {
                name: validatedData.name,
                brandId: validatedData.brandId,
                categoryId: validatedData.categoryId,
                imageUrl: validatedData.imageUrl,
                notes: validatedData.notes,
                isVerified: validatedData.isVerified || false,
                aliases: {
                    create: validatedData.aliases?.map(alias => ({ aliasName: alias })) || []
                },
                tags: {
                    create: validatedData.tags?.map(tag => ({ tagName: tag })) || []
                },
                compatibilityLists: {
                    create: validatedData.compatibilityLists?.map(comp => ({
                        compatibleWith: comp.compatibleWith,
                        connectorType: comp.connectorType,
                        type: comp.type,
                        isVerified: true
                    })) || []
                }
            },
            include: {
                brand: true,
                category: true,
                aliases: true,
                tags: true,
                compatibilityLists: true,
            }
        });
        res.status(201).json({ success: true, data: model });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.createModel = createModel;
const updateModel = async (req, res, next) => {
    try {
        const modelId = req.params.id;
        const { name, brandId, categoryId, isVerified, aliases, compatibilityLists } = req.body;
        const model = await db_1.default.model.update({
            where: { id: modelId },
            data: {
                ...(name && { name }),
                ...(brandId && { brandId }),
                ...(categoryId && { categoryId }),
                ...(isVerified !== undefined && { isVerified }),
                ...(aliases && {
                    aliases: {
                        deleteMany: {},
                        create: aliases.map((alias) => ({ aliasName: alias }))
                    }
                }),
                ...(compatibilityLists && {
                    compatibilityLists: {
                        deleteMany: {},
                        create: compatibilityLists.map((comp) => ({
                            compatibleWith: comp.compatibleWith,
                            connectorType: comp.connectorType || 'Standard',
                            type: comp.type || 'Display',
                            isVerified: true
                        }))
                    }
                })
            }
        });
        res.status(200).json({ success: true, data: model });
    }
    catch (error) {
        next(error);
    }
};
exports.updateModel = updateModel;
const deleteModel = async (req, res, next) => {
    try {
        const modelId = req.params.id;
        await db_1.default.model.delete({
            where: { id: modelId }
        });
        res.status(200).json({ success: true, message: 'Model deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteModel = deleteModel;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const bulkImportModels = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No CSV file uploaded' });
            return;
        }
        const results = [];
        fs_1.default.createReadStream(req.file.path)
            .pipe((0, csv_parser_1.default)({
            mapHeaders: ({ header }) => header.trim()
        }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
            let importedCount = 0;
            try {
                for (const row of results) {
                    // Flexible column resolution
                    const name = row['Model Name'] || row['name'] || row['Model'] || row['model'];
                    const brandVal = row['Brand'] || row['brand'] || row['Brand Name'] || row['Brand ID'] || row['brandId'];
                    const categoryVal = row['Category'] || row['category'] || row['Category Name'] || row['Category ID'] || row['categoryId'];
                    if (!name || !brandVal || !categoryVal)
                        continue;
                    const brandStr = String(brandVal).trim();
                    const categoryStr = String(categoryVal).trim();
                    const isValidObjectId = (val) => /^[0-9a-fA-F]{24}$/.test(val);
                    // Resolve or find/create Brand by ID (if valid ObjectId) or Name
                    let brand = await db_1.default.brand.findFirst({
                        where: isValidObjectId(brandStr)
                            ? { OR: [{ id: brandStr }, { name: { equals: brandStr, mode: 'insensitive' } }] }
                            : { name: { equals: brandStr, mode: 'insensitive' } }
                    });
                    if (!brand) {
                        brand = await db_1.default.brand.create({
                            data: { name: brandStr }
                        });
                    }
                    // Resolve or find/create Category by ID (if valid ObjectId) or Name
                    let category = await db_1.default.category.findFirst({
                        where: isValidObjectId(categoryStr)
                            ? { OR: [{ id: categoryStr }, { name: { equals: categoryStr, mode: 'insensitive' } }] }
                            : { name: { equals: categoryStr, mode: 'insensitive' } }
                    });
                    if (!category) {
                        category = await db_1.default.category.create({
                            data: { name: categoryStr }
                        });
                    }
                    // Create Model
                    const newModel = await db_1.default.model.create({
                        data: {
                            name: String(name).trim(),
                            brandId: brand.id,
                            categoryId: category.id,
                            isVerified: true
                        }
                    });
                    importedCount++;
                    const compatibleStr = row['Compatible Models'] || row['Compatible With'] || row['compatibleWith'] || row['compatibility'];
                    if (compatibleStr) {
                        const compats = String(compatibleStr).split(',').map((c) => c.trim()).filter(Boolean);
                        if (compats.length > 0) {
                            await db_1.default.compatibilityList.createMany({
                                data: compats.map((c) => ({
                                    modelId: newModel.id,
                                    compatibleWith: c,
                                    isVerified: true
                                }))
                            });
                        }
                    }
                }
                // Remove temp file
                if (fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(200).json({
                    success: true,
                    message: `Successfully imported ${importedCount} model(s).`
                });
            }
            catch (err) {
                if (fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                next(err);
            }
        })
            .on('error', (err) => {
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            next(err);
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkImportModels = bulkImportModels;
const requestModel = async (req, res, next) => {
    try {
        const { name, brandId, categoryId, notes } = req.body;
        if (!name || !brandId || !categoryId) {
            res.status(400).json({ success: false, message: 'Model name, brand, and category are required' });
            return;
        }
        const model = await db_1.default.model.create({
            data: {
                name,
                brandId: String(brandId),
                categoryId: String(categoryId),
                isVerified: false,
                notes: notes || 'Model requested by user'
            }
        });
        res.status(201).json({ success: true, message: 'Model request submitted successfully', data: model });
    }
    catch (error) {
        next(error);
    }
};
exports.requestModel = requestModel;
