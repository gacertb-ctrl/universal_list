import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const searchModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = (req.query.q || req.query.query) as string;

    if (!query || query.trim().length < 2) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const q = query.trim();

    // MySQL search across model name, brand name, category name, aliases, compatibility lists
    const models = await prisma.model.findMany({
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
      prisma.searchHistory.create({
        data: { userId, query: q }
      }).catch(console.error);
    }

    // Increment keyword search count
    prisma.searchKeyword.upsert({
      where: { keyword: q.toLowerCase() },
      update: { count: { increment: 1 } },
      create: { keyword: q.toLowerCase(), count: 1 }
    }).catch(console.error);

    res.status(200).json({ success: true, query: q, data: models });
  } catch (error) {
    next(error);
  }
};

export const getSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = (req.query.q || req.query.query) as string;

    if (!query || query.trim().length < 2) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const q = query.trim();

    const [matchingModels, matchingBrands, matchingCategories] = await Promise.all([
      prisma.model.findMany({
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
      prisma.brand.findMany({
        where: { isActive: true, name: { contains: q } },
        select: { id: true, name: true, logoUrl: true },
        take: 3
      }),
      prisma.category.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const getTrendingSearches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trending = await prisma.searchKeyword.findMany({
      orderBy: { count: 'desc' },
      take: 10
    });
    res.status(200).json({ success: true, data: trending });
  } catch (error) {
    next(error);
  }
};
