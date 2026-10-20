import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { z } from 'zod';
import fs from 'fs';
import csvParser from 'csv-parser';

const modelSchema = z.object({
  name: z.string().min(1, 'Model name is required'),
  brandId: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]),
  categoryId: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]),
  typeId: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
  notes: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
  aliases: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  compatibilityLists: z.array(z.object({
    compatibleWith: z.string().min(1),
    connectorType: z.string().optional(),
    type: z.string().optional(),
  })).optional()
});

export const getModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const brandIdParam = req.query.brandId as string || undefined;
    const categoryIdParam = req.query.categoryId as string || undefined;
    const typeIdParam = req.query.typeId as string || undefined;
    const searchParam = (req.query.search || req.query.q) as string || undefined;
    const isVerifiedParam = req.query.isVerified as string || undefined;

    const whereClause: any = { isActive: true };

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
      prisma.model.findMany({
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
      prisma.model.count({ where: whereClause })
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
  } catch (error) {
    next(error);
  }
};

export const getModelById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modelId = parseInt(String(req.params.id), 10);
    if (isNaN(modelId)) {
      res.status(400).json({ success: false, message: 'Invalid model ID' });
      return;
    }

    const model = await prisma.model.findUnique({
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
  } catch (error) {
    next(error);
  }
};

export const getModelCompatibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modelId = parseInt(String(req.params.id), 10);
    const model = await prisma.model.findUnique({
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
  } catch (error) {
    next(error);
  }
};

export const createModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = modelSchema.parse(req.body);

    const model = await prisma.model.create({
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

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10)) : null,
        action: 'CREATE_MODEL',
        resource: 'models',
        details: `Created model: ${model.name} (Brand: ${model.brandId}, Category: ${model.categoryId})`
      }
    });

    res.status(201).json({ success: true, data: model });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const updateModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modelId = parseInt(String(req.params.id), 10);
    const { name, brandId, categoryId, typeId, isVerified, notes, aliases, compatibilityLists } = req.body;

    const model = await prisma.model.update({
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
            create: aliases.map((alias: string) => ({ aliasName: alias }))
          }
        }),
        ...(compatibilityLists && {
          compatibilityLists: {
            deleteMany: {},
            create: compatibilityLists.map((comp: any) => ({
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
  } catch (error) {
    next(error);
  }
};

export const deleteModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modelId = parseInt(String(req.params.id), 10);
    await prisma.model.update({
      where: { id: modelId },
      data: { isActive: false }
    });

    res.status(200).json({ success: true, message: 'Model deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

export const addCompatibilityRelationship = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modelId = parseInt(String(req.params.id), 10);
    const { compatibleWith, connectorType, type, notes } = req.body;

    if (!compatibleWith) {
      res.status(400).json({ success: false, message: 'Compatible model name is required' });
      return;
    }

    const compRecord = await prisma.compatibilityList.create({
      data: {
        modelId,
        compatibleWith: String(compatibleWith).trim(),
        connectorType: connectorType || null,
        type: type || null,
        isVerified: true
      }
    });

    res.status(201).json({ success: true, data: compRecord });
  } catch (error) {
    next(error);
  }
};

export const requestModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, brandId, categoryId, notes } = req.body;

    if (!name || !brandId || !categoryId) {
      res.status(400).json({ success: false, message: 'Model name, brand, and category are required' });
      return;
    }

    const model = await prisma.model.create({
      data: {
        name,
        brandId: parseInt(String(brandId), 10),
        categoryId: parseInt(String(categoryId), 10),
        isVerified: false,
        notes: notes || 'Model requested by technician'
      }
    });

    res.status(201).json({ success: true, message: 'Model request submitted successfully', data: model });
  } catch (error) {
    next(error);
  }
};

export const bulkImportModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No CSV file uploaded' });
      return;
    }

    const results: any[] = [];
    fs.createReadStream(req.file.path)
      .pipe(csvParser({
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

            if (!name || !brandVal || !categoryVal) continue;

            const brandStr = String(brandVal).trim();
            const categoryStr = String(categoryVal).trim();

            let brand = await prisma.brand.findFirst({
              where: { name: brandStr }
            });
            if (!brand) {
              brand = await prisma.brand.create({
                data: {
                  name: brandStr,
                  slug: brandStr.toLowerCase().replace(/[^a-z0-9]/g, '-')
                }
              });
            }

            let category = await prisma.category.findFirst({
              where: { name: categoryStr }
            });
            if (!category) {
              category = await prisma.category.create({
                data: {
                  name: categoryStr,
                  slug: categoryStr.toLowerCase().replace(/[^a-z0-9]/g, '-')
                }
              });
            }

            const newModel = await prisma.model.create({
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
              const compats = String(compatibleStr).split(',').map((c: string) => c.trim()).filter(Boolean);
              if (compats.length > 0) {
                await prisma.compatibilityList.createMany({
                  data: compats.map((c: string) => ({
                    modelId: newModel.id,
                    compatibleWith: c,
                    type: category.name,
                    isVerified: true
                  }))
                });
              }
            }
          }

          if (fs.existsSync(req.file!.path)) {
            fs.unlinkSync(req.file!.path);
          }

          res.status(200).json({
            success: true,
            message: `Successfully imported ${importedCount} model(s).`
          });
        } catch (err) {
          if (fs.existsSync(req.file!.path)) {
            fs.unlinkSync(req.file!.path);
          }
          next(err);
        }
      })
      .on('error', (err) => {
        if (fs.existsSync(req.file!.path)) {
          fs.unlinkSync(req.file!.path);
        }
        next(err);
      });

  } catch (error) {
    next(error);
  }
};

export const exportSampleCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const csvHeaders = 'Model Name,Brand,Category,Compatible Models\n';
    const sampleRows = [
      'Galaxy S24,Samsung,Tempered Glass,"Galaxy S23, Galaxy S22"',
      'iPhone 15 Pro,Apple,Tempered Glass,"iPhone 14 Pro, iPhone 16 Pro"',
      'Vivo Y200 5G,Vivo,CC Board / Charging Board,"Vivo Y100, Vivo V29e"',
      'Redmi Note 13 Pro,Xiaomi,Battery,"Poco X6 5G, Redmi Note 12 Pro"',
      'OnePlus 12R,OnePlus,Combo / Display,"Realme GT Neo 5, OnePlus 11R"',
      'Realme 12 Pro,Realme,Strip / Flex Cable,"Realme 12 Pro Plus"',
      'Pixel 8 Pro,Google,Display Connector,"Pixel 7 Pro"'
    ].join('\n');

    const csvContent = csvHeaders + sampleRows + '\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_models_import.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
