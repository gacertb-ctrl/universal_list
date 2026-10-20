"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBrand = exports.updateBrand = exports.createBrand = exports.getBrandById = exports.getBrands = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const brandSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Brand name is required'),
    slug: zod_1.z.string().optional(),
    logoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    isActive: zod_1.z.boolean().optional().default(true),
});
const getBrands = async (req, res, next) => {
    try {
        const brands = await db_1.default.brand.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { models: true },
                },
            },
        });
        res.status(200).json({ success: true, data: brands });
    }
    catch (error) {
        next(error);
    }
};
exports.getBrands = getBrands;
const getBrandById = async (req, res, next) => {
    try {
        const rawId = String(req.params.id);
        const isNum = /^\d+$/.test(rawId);
        const brand = await db_1.default.brand.findFirst({
            where: isNum ? { id: parseInt(rawId, 10) } : { slug: rawId },
            include: {
                _count: {
                    select: { models: true }
                }
            }
        });
        if (!brand) {
            res.status(404).json({ success: false, message: 'Brand not found' });
            return;
        }
        res.status(200).json({ success: true, data: brand });
    }
    catch (error) {
        next(error);
    }
};
exports.getBrandById = getBrandById;
const createBrand = async (req, res, next) => {
    try {
        const validatedData = brandSchema.parse(req.body);
        const slug = validatedData.slug || validatedData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const existingBrand = await db_1.default.brand.findFirst({
            where: { OR: [{ name: validatedData.name }, { slug }] }
        });
        if (existingBrand) {
            res.status(400).json({ success: false, message: 'Brand already exists' });
            return;
        }
        const brand = await db_1.default.brand.create({
            data: {
                ...validatedData,
                slug
            }
        });
        res.status(201).json({ success: true, data: brand });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.createBrand = createBrand;
const updateBrand = async (req, res, next) => {
    try {
        const brandId = parseInt(String(req.params.id), 10);
        const validatedData = brandSchema.partial().parse(req.body);
        const brand = await db_1.default.brand.update({
            where: { id: brandId },
            data: validatedData,
        });
        res.status(200).json({ success: true, data: brand });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.updateBrand = updateBrand;
const deleteBrand = async (req, res, next) => {
    try {
        const brandId = parseInt(String(req.params.id), 10);
        await db_1.default.brand.update({
            where: { id: brandId },
            data: { isActive: false }
        });
        res.status(200).json({ success: true, message: 'Brand deactivated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBrand = deleteBrand;
