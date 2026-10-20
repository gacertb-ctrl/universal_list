import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  navigationType: z.enum(['type_first', 'brand_first']).default('brand_first'),
  sortOrder: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const categoryTypeSchema = z.object({
  name: z.string().min(1, 'Type name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  sortOrder: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = String(req.params.id);
    const isNum = /^\d+$/.test(rawId);

    const category = await prisma.category.findFirst({
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
  } catch (error) {
    next(error);
  }
};

export const getCategoryTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = String(req.params.id);
    const isNum = /^\d+$/.test(rawId);

    const category = await prisma.category.findFirst({
      where: isNum ? { id: parseInt(rawId, 10) } : { slug: rawId }
    });

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const types = await prisma.categoryType.findMany({
      where: { categoryId: category.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { models: true }
        }
      }
    });

    res.status(200).json({ success: true, category, data: types });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBrands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = String(req.params.id);
    const typeIdParam = req.query.typeId as string | undefined;
    const isNum = /^\d+$/.test(rawId);

    const category = await prisma.category.findFirst({
      where: isNum ? { id: parseInt(rawId, 10) } : { slug: rawId }
    });

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const typeId = typeIdParam ? parseInt(typeIdParam, 10) : undefined;

    // Fetch all brands that have models in this category (and type if specified)
    const brandsWithModels = await prisma.brand.findMany({
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
    const allBrands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    const modelCountMap: Record<number, number> = {};
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
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = categorySchema.parse(req.body);
    const slug = validatedData.slug || validatedData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const existingCategory = await prisma.category.findFirst({
      where: { OR: [{ name: validatedData.name }, { slug }] }
    });
    if (existingCategory) {
      res.status(400).json({ success: false, message: 'Category name or slug already exists' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        slug
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10)) : null,
        action: 'CREATE_CATEGORY',
        resource: 'categories',
        details: `Created category: ${category.name} (${category.slug})`
      }
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categoryId = parseInt(String(req.params.id), 10);
    const validatedData = categorySchema.partial().parse(req.body);

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: validatedData,
    });

    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const createCategoryType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categoryId = parseInt(String(req.params.id), 10);
    const validatedData = categoryTypeSchema.parse(req.body);

    const newType = await prisma.categoryType.create({
      data: {
        categoryId,
        ...validatedData
      }
    });

    res.status(201).json({ success: true, data: newType });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const updateCategoryType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const typeId = parseInt(String(req.params.typeId), 10);
    const validatedData = categoryTypeSchema.partial().parse(req.body);

    const updatedType = await prisma.categoryType.update({
      where: { id: typeId },
      data: validatedData
    });

    res.status(200).json({ success: true, data: updatedType });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categoryId = parseInt(String(req.params.id), 10);
    // Soft delete / deactivate
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false }
    });
    res.status(200).json({ success: true, message: 'Category deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
