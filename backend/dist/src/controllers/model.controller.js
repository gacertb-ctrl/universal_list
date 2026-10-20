"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportModels = exports.requestModel = exports.addCompatibilityRelationship = exports.deleteModel = exports.updateModel = exports.createModel = exports.getModelCompatibility = exports.getModelById = exports.getModels = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const modelSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Model name is required'),
    brandId: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(v => parseInt(v, 10))]),
    categoryId: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(v => parseInt(v, 10))]),
    typeId: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')).nullable(),
    notes: zod_1.z.string().optional().nullable(),
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
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const brandIdParam = req.query.brandId || undefined;
        const categoryIdParam = req.query.categoryId || undefined;
        const typeIdParam = req.query.typeId || undefined;
        const searchParam = (req.query.search || req.query.q) || undefined;
        const isVerifiedParam = req.query.isVerified || undefined;
        const whereClause = { isActive: true };
        if (brandIdParam) {
            whereClause.brandId = parseInt(brandIdParam, 10);
        }
        if (categoryIdParam) {
            whereClause.categoryId = parseInt(categoryIdParam, 10);
        }
        if (typeIdParam) {
            whereClause.typeId = parseInt(typeIdParam, 10);
        }
        if (isVerifiedParam !== undefined) {
            whereClause.isVerified = isVerifiedParam === 'true';
        }
        if (searchParam && searchParam.trim().length > 0) {
            const q = searchParam.trim();
            whereClause.OR = [
                { name: { contains: q } },
                { brand: { name: { contains: q } } },
                { aliases: { some: { aliasName: { contains: q } } } },
                { compatibilityLists: { some: { compatibleWith: { contains: q } } } }
            ];
        }
        const [models, total] = await Promise.all([
            db_1.default.model.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    brand: true,
                    category: true,
                    categoryType: true,
                    aliases: true,
                    tags: true,
                    compatibilityLists: true,
                    _count: {
                        select: { compatibilityLists: true }
                    }
                },
                orderBy: [{ isVerified: 'desc' }, { updatedAt: 'desc' }]
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
        const modelId = parseInt(String(req.params.id), 10);
        if (isNaN(modelId)) {
            res.status(400).json({ success: false, message: 'Invalid model ID' });
            return;
        }
        const model = await db_1.default.model.findUnique({
            where: { id: modelId },
            include: {
                brand: true,
                category: true,
                categoryType: true,
                aliases: true,
                tags: true,
                compatibilityLists: true,
                sourceCompatibilities: {
                    include: { targetModel: { include: { brand: true } } }
                },
                targetCompatibilities: {
                    include: { sourceModel: { include: { brand: true } } }
                }
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
const getModelCompatibility = async (req, res, next) => {
    try {
        const modelId = parseInt(String(req.params.id), 10);
        const model = await db_1.default.model.findUnique({
            where: { id: modelId },
            include: {
                brand: true,
                category: true,
                categoryType: true,
                compatibilityLists: true,
                sourceCompatibilities: {
                    include: { targetModel: { include: { brand: true } } }
                }
            }
        });
        if (!model) {
            res.status(404).json({ success: false, message: 'Model not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                model,
                compatibilities: model.compatibilityLists,
                linkedModels: model.sourceCompatibilities
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getModelCompatibility = getModelCompatibility;
const createModel = async (req, res, next) => {
    try {
        const validatedData = modelSchema.parse(req.body);
        const model = await db_1.default.model.create({
            data: {
                name: validatedData.name,
                brandId: validatedData.brandId,
                categoryId: validatedData.categoryId,
                typeId: validatedData.typeId || null,
                imageUrl: validatedData.imageUrl,
                notes: validatedData.notes,
                isVerified: validatedData.isVerified ?? false,
                lastVerifiedAt: validatedData.isVerified ? new Date() : null,
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
                categoryType: true,
                aliases: true,
                tags: true,
                compatibilityLists: true,
            }
        });
        await db_1.default.auditLog.create({
            data: {
                userId: req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10)) : null,
                action: 'CREATE_MODEL',
                resource: 'models',
                details: `Created model: ${model.name} (Brand: ${model.brandId}, Category: ${model.categoryId})`
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
        const modelId = parseInt(String(req.params.id), 10);
        const { name, brandId, categoryId, typeId, isVerified, notes, aliases, compatibilityLists } = req.body;
        const model = await db_1.default.model.update({
            where: { id: modelId },
            data: {
                ...(name && { name }),
                ...(brandId && { brandId: parseInt(brandId, 10) }),
                ...(categoryId && { categoryId: parseInt(categoryId, 10) }),
                ...(typeId !== undefined && { typeId: typeId ? parseInt(typeId, 10) : null }),
                ...(isVerified !== undefined && {
                    isVerified,
                    lastVerifiedAt: isVerified ? new Date() : null
                }),
                ...(notes !== undefined && { notes }),
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
                            type: comp.type || 'Compatibility',
                            isVerified: true
                        }))
                    }
                })
            },
            include: {
                brand: true,
                category: true,
                categoryType: true,
                aliases: true,
                compatibilityLists: true
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
        const modelId = parseInt(String(req.params.id), 10);
        await db_1.default.model.update({
            where: { id: modelId },
            data: { isActive: false }
        });
        res.status(200).json({ success: true, message: 'Model deactivated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteModel = deleteModel;
const addCompatibilityRelationship = async (req, res, next) => {
    try {
        const modelId = parseInt(String(req.params.id), 10);
        const { compatibleWith, connectorType, type, notes } = req.body;
        if (!compatibleWith) {
            res.status(400).json({ success: false, message: 'Compatible model name is required' });
            return;
        }
        const compRecord = await db_1.default.compatibilityList.create({
            data: {
                modelId,
                compatibleWith: String(compatibleWith).trim(),
                connectorType: connectorType || null,
                type: type || null,
                isVerified: true
            }
        });
        res.status(201).json({ success: true, data: compRecord });
    }
    catch (error) {
        next(error);
    }
};
exports.addCompatibilityRelationship = addCompatibilityRelationship;
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
                brandId: parseInt(String(brandId), 10),
                categoryId: parseInt(String(categoryId), 10),
                isVerified: false,
                notes: notes || 'Model requested by technician'
            }
        });
        res.status(201).json({ success: true, message: 'Model request submitted successfully', data: model });
    }
    catch (error) {
        next(error);
    }
};
exports.requestModel = requestModel;
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
                    const name = row['Model Name'] || row['name'] || row['Model'] || row['model'];
                    const brandVal = row['Brand'] || row['brand'] || row['Brand Name'];
                    const categoryVal = row['Category'] || row['category'] || row['Category Name'];
                    if (!name || !brandVal || !categoryVal)
                        continue;
                    const brandStr = String(brandVal).trim();
                    const categoryStr = String(categoryVal).trim();
                    let brand = await db_1.default.brand.findFirst({
                        where: { name: brandStr }
                    });
                    if (!brand) {
                        brand = await db_1.default.brand.create({
                            data: {
                                name: brandStr,
                                slug: brandStr.toLowerCase().replace(/[^a-z0-9]/g, '-')
                            }
                        });
                    }
                    let category = await db_1.default.category.findFirst({
                        where: { name: categoryStr }
                    });
                    if (!category) {
                        category = await db_1.default.category.create({
                            data: {
                                name: categoryStr,
                                slug: categoryStr.toLowerCase().replace(/[^a-z0-9]/g, '-')
                            }
                        });
                    }
                    const newModel = await db_1.default.model.create({
                        data: {
                            name: String(name).trim(),
                            brandId: brand.id,
                            categoryId: category.id,
                            isVerified: true,
                            lastVerifiedAt: new Date()
                        }
                    });
                    importedCount++;
                    const compatibleStr = row['Compatible Models'] || row['Compatible With'] || row['compatibleWith'];
                    if (compatibleStr) {
                        const compats = String(compatibleStr).split(',').map((c) => c.trim()).filter(Boolean);
                        if (compats.length > 0) {
                            await db_1.default.compatibilityList.createMany({
                                data: compats.map((c) => ({
                                    modelId: newModel.id,
                                    compatibleWith: c,
                                    type: category.name,
                                    isVerified: true
                                }))
                            });
                        }
                    }
                }
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
