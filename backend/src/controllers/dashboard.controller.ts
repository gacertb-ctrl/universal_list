import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalModels,
      totalBrands,
      totalCategories,
      verifiedModels,
      totalCompatibilities,
      pendingAiCandidates,
      totalUsers
    ] = await Promise.all([
      prisma.model.count({ where: { isActive: true } }),
      prisma.brand.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.model.count({ where: { isActive: true, isVerified: true } }),
      prisma.compatibilityList.count(),
      prisma.aiUpdateCandidate.count({ where: { verificationStatus: 'unverified' } }),
      prisma.user.count()
    ]);

    // Category breakdown
    const categoriesRaw = await prisma.category.findMany({
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
    const trendingSearches = await prisma.searchKeyword.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const getRecentUpdates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Fetch latest 10 models added or updated from MySQL
    const recentModels = await prisma.model.findMany({
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
  } catch (error) {
    next(error);
  }
};
