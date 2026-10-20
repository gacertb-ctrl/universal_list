import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { z } from 'zod';

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  slug: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

export const getBrands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { models: true },
        },
      },
    });
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

export const getBrandById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = String(req.params.id);
    const isNum = /^\d+$/.test(rawId);

    const brand = await prisma.brand.findFirst({
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
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = brandSchema.parse(req.body);
    const slug = validatedData.slug || validatedData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const existingBrand = await prisma.brand.findFirst({
      where: { OR: [{ name: validatedData.name }, { slug }] }
    });
    if (existingBrand) {
      res.status(400).json({ success: false, message: 'Brand already exists' });
      return;
    }

    const brand = await prisma.brand.create({
      data: {
        ...validatedData,
        slug
      }
    });
    res.status(201).json({ success: true, data: brand });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const updateBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brandId = parseInt(String(req.params.id), 10);
    const validatedData = brandSchema.partial().parse(req.body);

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: validatedData,
    });
    res.status(200).json({ success: true, data: brand });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const deleteBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brandId = parseInt(String(req.params.id), 10);
    await prisma.brand.update({
      where: { id: brandId },
      data: { isActive: false }
    });
    res.status(200).json({ success: true, message: 'Brand deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
