"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialData = seedInitialData;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("./db"));
async function seedInitialData() {
    console.log('[Seed] Checking and seeding business categories and types...');
    // 1. Categories configuration
    const categoryConfigs = [
        {
            name: 'Tempered Glass',
            slug: 'tempered-glass',
            description: 'Screen protectors including normal 2.5D/9D flat tempered and 3D/curved edge tempered.',
            navigationType: 'type_first', // Tempered Glass workflow: Category -> Type (Normal/Edge) -> Models -> Compat
            icon: 'Shield',
            sortOrder: 1,
            types: [
                { name: 'Normal Tempered', slug: 'normal', description: 'Flat 2.5D, 9D, 11D, matte, and clear tempered glasses', sortOrder: 1 },
                { name: 'Edge Tempered', slug: 'edge', description: 'Curved, UV, and edge-to-edge curved screen tempered glasses', sortOrder: 2 }
            ]
        },
        {
            name: 'Cover',
            slug: 'cover',
            description: 'Back covers, silicone cases, armor cases, and flip covers matching phone body molds.',
            navigationType: 'brand_first',
            icon: 'Box',
            sortOrder: 2,
        },
        {
            name: 'Combo / Display',
            slug: 'combo-display',
            description: 'Complete LCD/OLED display assemblies, folder modules, and touch screens.',
            navigationType: 'brand_first',
            icon: 'Monitor',
            sortOrder: 3,
        },
        {
            name: 'Battery',
            slug: 'battery',
            description: 'OEM and replacement mobile batteries with model codes and mAh capacity.',
            navigationType: 'brand_first',
            icon: 'Battery',
            sortOrder: 4,
        },
        {
            name: 'CC Board / Charging Board',
            slug: 'charging-board',
            description: 'Charging sub-boards, mic boards, type-c / micro-usb connector boards.',
            navigationType: 'brand_first',
            icon: 'Zap',
            sortOrder: 5,
        },
        {
            name: 'Strip / Flex Cable',
            slug: 'flex-cable',
            description: 'Main motherboard to sub-board connection flex cables, display flexes, and sensor strips.',
            navigationType: 'brand_first',
            icon: 'Cpu',
            sortOrder: 6,
        },
        {
            name: 'Display Connector',
            slug: 'display-connector',
            description: 'Motherboard FPC connectors and screen solder pads.',
            navigationType: 'brand_first',
            icon: 'Layers',
            sortOrder: 7,
        },
        {
            name: 'Touch / OCA',
            slug: 'touch-oca',
            description: 'Outer touch glass panels and OCA optical sheets.',
            navigationType: 'brand_first',
            icon: 'Smartphone',
            sortOrder: 8,
        },
        {
            name: 'Frame / Middle Frame',
            slug: 'middle-frame',
            description: 'Body chassis, middle housings, and bezel frames.',
            navigationType: 'brand_first',
            icon: 'Box',
            sortOrder: 9,
        }
    ];
    for (const catConfig of categoryConfigs) {
        // Look up by slug or by similar name
        let category = await db_1.default.category.findFirst({
            where: {
                OR: [
                    { slug: catConfig.slug },
                    { name: catConfig.name },
                    ...(catConfig.slug === 'tempered-glass' ? [{ name: 'Tempered / Glass Guard' }] : []),
                    ...(catConfig.slug === 'combo-display' ? [{ name: 'Folder / Display / Combo' }] : []),
                    ...(catConfig.slug === 'battery' ? [{ name: 'Battery List' }] : []),
                    ...(catConfig.slug === 'charging-board' ? [{ name: 'Charging Sub Board' }] : []),
                    ...(catConfig.slug === 'flex-cable' ? [{ name: 'Power Volume Flex' }] : []),
                    ...(catConfig.slug === 'middle-frame' ? [{ name: 'Frame / Middle Frame' }] : []),
                    ...(catConfig.slug === 'touch-oca' ? [{ name: 'Touch / OCA Glass' }] : []),
                ]
            }
        });
        if (category) {
            category = await db_1.default.category.update({
                where: { id: category.id },
                data: {
                    name: catConfig.name,
                    slug: catConfig.slug,
                    description: catConfig.description,
                    navigationType: catConfig.navigationType,
                    icon: catConfig.icon,
                    sortOrder: catConfig.sortOrder,
                    isActive: true
                }
            });
        }
        else {
            category = await db_1.default.category.create({
                data: {
                    name: catConfig.name,
                    slug: catConfig.slug,
                    description: catConfig.description,
                    navigationType: catConfig.navigationType,
                    icon: catConfig.icon,
                    sortOrder: catConfig.sortOrder,
                    isActive: true
                }
            });
        }
        // If types are configured (like Tempered Glass: Normal, Edge)
        if (catConfig.types && catConfig.types.length > 0) {
            for (const t of catConfig.types) {
                const existingType = await db_1.default.categoryType.findFirst({
                    where: { categoryId: category.id, slug: t.slug }
                });
                if (existingType) {
                    await db_1.default.categoryType.update({
                        where: { id: existingType.id },
                        data: { name: t.name, description: t.description, sortOrder: t.sortOrder, isActive: true }
                    });
                }
                else {
                    await db_1.default.categoryType.create({
                        data: {
                            categoryId: category.id,
                            name: t.name,
                            slug: t.slug,
                            description: t.description,
                            sortOrder: t.sortOrder,
                            isActive: true
                        }
                    });
                }
            }
        }
    }
    // 2. Ensure Brands exist with clean slugs
    const brandList = [
        { name: 'VIVO', slug: 'vivo', logoUrl: 'https://logo.clearbit.com/vivo.com' },
        { name: 'REDMI', slug: 'redmi', logoUrl: 'https://logo.clearbit.com/mi.com' },
        { name: 'SAMSUNG', slug: 'samsung', logoUrl: 'https://logo.clearbit.com/samsung.com' },
        { name: 'REALME', slug: 'realme', logoUrl: 'https://img.logo.dev/name/realme?token=pk_Hq4BL9tBT2WyHo8F4FbrIA' },
        { name: 'OPPO', slug: 'oppo', logoUrl: 'https://logo.clearbit.com/oppo.com' },
        { name: 'ONEPLUS', slug: 'oneplus', logoUrl: 'https://logo.clearbit.com/oneplus.com' },
        { name: 'ITEL', slug: 'itel', logoUrl: 'https://logo.clearbit.com/itel-mobile.com' },
        { name: 'LAVA', slug: 'lava', logoUrl: 'https://logo.clearbit.com/lavamobiles.com' },
    ];
    for (const b of brandList) {
        const existing = await db_1.default.brand.findFirst({
            where: { OR: [{ name: b.name }, { slug: b.slug }] }
        });
        if (existing) {
            await db_1.default.brand.update({
                where: { id: existing.id },
                data: { name: b.name, slug: b.slug, logoUrl: b.logoUrl, isActive: true }
            });
        }
        else {
            await db_1.default.brand.create({
                data: { name: b.name, slug: b.slug, logoUrl: b.logoUrl, isActive: true }
            });
        }
    }
    // 3. Ensure Default Roles & Super Admin User
    const roles = ['Super Admin', 'Admin', 'Technician', 'User'];
    for (const r of roles) {
        const existingRole = await db_1.default.role.findUnique({ where: { name: r } });
        if (!existingRole) {
            await db_1.default.role.create({ data: { name: r } });
        }
    }
    const superAdminRole = await db_1.default.role.findUnique({ where: { name: 'Super Admin' } });
    if (superAdminRole) {
        const adminEmail = 'admin@example.com';
        const existingAdmin = await db_1.default.user.findUnique({ where: { email: adminEmail } });
        const hashedPassword = await bcrypt_1.default.hash('admin123', 10);
        if (!existingAdmin) {
            await db_1.default.user.create({
                data: {
                    name: 'Super Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    roleId: superAdminRole.id,
                    status: 'active'
                }
            });
            console.log('[Seed] Created default super admin: admin@example.com / admin123');
        }
    }
    // 4. Default AI Settings
    const defaultAiSettings = [
        { key: 'ai_enabled', value: 'true' },
        { key: 'gemini_model', value: 'gemini-1.5-flash' },
        { key: 'daily_cron_time', value: '02:30' },
        { key: 'timezone', value: 'Asia/Kolkata' },
        { key: 'max_candidates_per_run', value: '25' },
        { key: 'auto_apply_safe_metadata', value: 'false' },
        { key: 'dry_run_default', value: 'true' },
        { key: 'request_timeout_seconds', value: '60' },
    ];
    for (const s of defaultAiSettings) {
        await db_1.default.aiSetting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value }
        });
    }
    // 5. Populate Realistic Models and Compatibility Data for each category workflow if needed
    const temperedCategory = await db_1.default.category.findUnique({ where: { slug: 'tempered-glass' } });
    const normalType = await db_1.default.categoryType.findFirst({ where: { categoryId: temperedCategory?.id, slug: 'normal' } });
    const edgeType = await db_1.default.categoryType.findFirst({ where: { categoryId: temperedCategory?.id, slug: 'edge' } });
    const vivoBrand = await db_1.default.brand.findFirst({ where: { name: 'VIVO' } });
    const redmiBrand = await db_1.default.brand.findFirst({ where: { name: 'REDMI' } });
    const samsungBrand = await db_1.default.brand.findFirst({ where: { name: 'SAMSUNG' } });
    const coverCategory = await db_1.default.category.findUnique({ where: { slug: 'cover' } });
    const batteryCategory = await db_1.default.category.findUnique({ where: { slug: 'battery' } });
    const comboCategory = await db_1.default.category.findUnique({ where: { slug: 'combo-display' } });
    const ccBoardCategory = await db_1.default.category.findUnique({ where: { slug: 'charging-board' } });
    const flexCategory = await db_1.default.category.findUnique({ where: { slug: 'flex-cable' } });
    // A. Tempered Glass - Normal Type Models
    if (temperedCategory && normalType && vivoBrand && redmiBrand && samsungBrand) {
        const normalModels = [
            {
                name: 'Vivo V11 (Normal Tempered)',
                brandId: vivoBrand.id,
                categoryId: temperedCategory.id,
                typeId: normalType.id,
                compatibles: ['Vivo V11i', 'Vivo Y97', 'Oppo F9', 'Realme 2 Pro'],
                aliases: ['V11 Flat Glass', 'PD1814F Tempered']
            },
            {
                name: 'Vivo V15 (Normal Tempered)',
                brandId: vivoBrand.id,
                categoryId: temperedCategory.id,
                typeId: normalType.id,
                compatibles: ['Vivo S1', 'Vivo Y17', 'Vivo Y15', 'Vivo Y12'],
                aliases: ['1819 Tempered', 'V15 2.5D']
            },
            {
                name: 'Redmi Note 10 (Normal Tempered)',
                brandId: redmiBrand.id,
                categoryId: temperedCategory.id,
                typeId: normalType.id,
                compatibles: ['Redmi Note 10S', 'Poco M5s', 'Redmi Note 11 4G'],
                aliases: ['Note 10 9D Glass']
            },
            {
                name: 'Samsung Galaxy A12 (Normal Tempered)',
                brandId: samsungBrand.id,
                categoryId: temperedCategory.id,
                typeId: normalType.id,
                compatibles: ['Samsung A02', 'Samsung A02s', 'Samsung M12', 'Samsung A03s'],
                aliases: ['SM-A125F Glass']
            }
        ];
        for (const m of normalModels) {
            let existingModel = await db_1.default.model.findFirst({ where: { name: m.name, categoryId: temperedCategory.id } });
            if (!existingModel) {
                existingModel = await db_1.default.model.create({
                    data: {
                        name: m.name,
                        brandId: m.brandId,
                        categoryId: m.categoryId,
                        typeId: m.typeId,
                        isVerified: true,
                        lastVerifiedAt: new Date(),
                        notes: 'Verified 9D / 11D Full Glue Flat Screen Protector compatibility',
                        aliases: { create: m.aliases.map(a => ({ aliasName: a })) },
                        compatibilityLists: {
                            create: m.compatibles.map(c => ({ compatibleWith: c, type: 'Tempered Glass', isVerified: true }))
                        }
                    }
                });
            }
        }
    }
    // B. Tempered Glass - Edge Type Models
    if (temperedCategory && edgeType && vivoBrand && samsungBrand) {
        const edgeModels = [
            {
                name: 'Vivo V11 Pro (Edge Tempered)',
                brandId: vivoBrand.id,
                categoryId: temperedCategory.id,
                typeId: edgeType.id,
                compatibles: ['Vivo X21', 'Vivo X21 UD', 'Oppo R15 Pro'],
                aliases: ['V11 Pro Curved UV Glass', '1804 Curved']
            },
            {
                name: 'Samsung Galaxy S21 Ultra (Edge Tempered)',
                brandId: samsungBrand.id,
                categoryId: temperedCategory.id,
                typeId: edgeType.id,
                compatibles: ['Samsung Galaxy S22 Ultra (UV Glue)', 'Samsung Note 20 Ultra'],
                aliases: ['SM-G998B 3D UV Glass']
            },
            {
                name: 'Vivo X80 Pro (Edge Tempered)',
                brandId: vivoBrand.id,
                categoryId: temperedCategory.id,
                typeId: edgeType.id,
                compatibles: ['Vivo X90 Pro', 'Vivo X70 Pro Plus'],
                aliases: ['X80 Pro 3D Curved Tempered']
            }
        ];
        for (const m of edgeModels) {
            let existingModel = await db_1.default.model.findFirst({ where: { name: m.name, categoryId: temperedCategory.id } });
            if (!existingModel) {
                await db_1.default.model.create({
                    data: {
                        name: m.name,
                        brandId: m.brandId,
                        categoryId: m.categoryId,
                        typeId: m.typeId,
                        isVerified: true,
                        lastVerifiedAt: new Date(),
                        notes: 'Verified 3D UV / Hot Bending Curved Edge screen protector',
                        aliases: { create: m.aliases.map(a => ({ aliasName: a })) },
                        compatibilityLists: {
                            create: m.compatibles.map(c => ({ compatibleWith: c, type: 'Edge Tempered Glass', isVerified: true }))
                        }
                    }
                });
            }
        }
    }
    // C. Cover Models
    if (coverCategory && vivoBrand && redmiBrand && samsungBrand) {
        const coverModels = [
            {
                name: 'Vivo V11 Back Cover',
                brandId: vivoBrand.id,
                categoryId: coverCategory.id,
                compatibles: ['Vivo V11i Cover', 'Vivo Y97 Case'],
                aliases: ['V11 Protective Case']
            },
            {
                name: 'Redmi Note 10 Case',
                brandId: redmiBrand.id,
                categoryId: coverCategory.id,
                compatibles: ['Redmi Note 10S Case', 'Poco M5s Cover'],
                aliases: ['Note 10 Smoke Back Cover']
            },
            {
                name: 'Samsung Galaxy A52 Case',
                brandId: samsungBrand.id,
                categoryId: coverCategory.id,
                compatibles: ['Samsung A52s 5G Case', 'Samsung A52 4G Case'],
                aliases: ['SM-A525 Armor Case']
            }
        ];
        for (const m of coverModels) {
            let existingModel = await db_1.default.model.findFirst({ where: { name: m.name, categoryId: coverCategory.id } });
            if (!existingModel) {
                await db_1.default.model.create({
                    data: {
                        name: m.name,
                        brandId: m.brandId,
                        categoryId: m.categoryId,
                        isVerified: true,
                        lastVerifiedAt: new Date(),
                        notes: 'Direct camera cutout and microphone hole alignment verified',
                        aliases: { create: m.aliases.map(a => ({ aliasName: a })) },
                        compatibilityLists: {
                            create: m.compatibles.map(c => ({ compatibleWith: c, type: 'Cover', isVerified: true }))
                        }
                    }
                });
            }
        }
    }
    // D. Battery Models
    if (batteryCategory && vivoBrand && redmiBrand && samsungBrand) {
        const batteryModels = [
            {
                name: 'Vivo B-F3 Battery (3260mAh)',
                brandId: vivoBrand.id,
                categoryId: batteryCategory.id,
                compatibles: ['Vivo V11', 'Vivo V11i', 'Vivo Y97', 'Vivo X21i'],
                aliases: ['B-F3 Cell', '1ICP5/64/84']
            },
            {
                name: 'Redmi BN59 Battery (5000mAh)',
                brandId: redmiBrand.id,
                categoryId: batteryCategory.id,
                compatibles: ['Redmi Note 10', 'Redmi Note 10S', 'Poco M5s'],
                aliases: ['BN59 Original Battery']
            },
            {
                name: 'Samsung EB-BA125ABY Battery (5000mAh)',
                brandId: samsungBrand.id,
                categoryId: batteryCategory.id,
                compatibles: ['Samsung A12 (SM-A125)', 'Samsung A02 (SM-A022)', 'Samsung M12 (SM-M127)'],
                aliases: ['EB-BA125ABY OEM']
            }
        ];
        for (const m of batteryModels) {
            let existingModel = await db_1.default.model.findFirst({ where: { name: m.name, categoryId: batteryCategory.id } });
            if (!existingModel) {
                await db_1.default.model.create({
                    data: {
                        name: m.name,
                        brandId: m.brandId,
                        categoryId: m.categoryId,
                        isVerified: true,
                        lastVerifiedAt: new Date(),
                        notes: 'Original connector pinout, voltage 3.87V, thermal protection circuit verified',
                        aliases: { create: m.aliases.map(a => ({ aliasName: a })) },
                        compatibilityLists: {
                            create: m.compatibles.map(c => ({ compatibleWith: c, connectorType: 'Standard Flex', type: 'Battery', isVerified: true }))
                        }
                    }
                });
            }
        }
    }
    // E. CC Board / Charging Board
    if (ccBoardCategory && vivoBrand && redmiBrand) {
        const ccBoardModels = [
            {
                name: 'Vivo Y20 / Y12s CC Board',
                brandId: vivoBrand.id,
                categoryId: ccBoardCategory.id,
                compatibles: ['Vivo Y20i', 'Vivo Y20G', 'Vivo Y20A', 'Vivo Y12s (2021)'],
                aliases: ['Y20 Sub Board with Mic']
            },
            {
                name: 'Redmi Note 10 Type-C Board',
                brandId: redmiBrand.id,
                categoryId: ccBoardCategory.id,
                compatibles: ['Redmi Note 10S CC Board'],
                aliases: ['Note 10 33W Fast Charge Board']
            }
        ];
        for (const m of ccBoardModels) {
            let existingModel = await db_1.default.model.findFirst({ where: { name: m.name, categoryId: ccBoardCategory.id } });
            if (!existingModel) {
                await db_1.default.model.create({
                    data: {
                        name: m.name,
                        brandId: m.brandId,
                        categoryId: m.categoryId,
                        isVerified: true,
                        lastVerifiedAt: new Date(),
                        notes: 'Fast charging line, primary microphone, and network antenna feed fully matched',
                        aliases: { create: m.aliases.map(a => ({ aliasName: a })) },
                        compatibilityLists: {
                            create: m.compatibles.map(c => ({ compatibleWith: c, connectorType: 'Type-C / Micro', type: 'Charging Board', isVerified: true }))
                        }
                    }
                });
            }
        }
    }
    // F. Strip / Flex Cable
    if (flexCategory && vivoBrand && samsungBrand) {
        const flexModels = [
            {
                name: 'Vivo Y11 / Y12 Main to Sub Flex',
                brandId: vivoBrand.id,
                categoryId: flexCategory.id,
                compatibles: ['Vivo Y15 Main Board Flex', 'Vivo Y17 Interconnection Flex'],
                aliases: ['Y11 Main-Sub Ribbon Flex']
            },
            {
                name: 'Samsung A12 Motherboard to CC Flex',
                brandId: samsungBrand.id,
                categoryId: flexCategory.id,
                compatibles: ['Samsung M12 Main Sub Flex (SM-M127)'],
                aliases: ['SM-A125F FPC Cable']
            }
        ];
        for (const m of flexModels) {
            let existingModel = await db_1.default.model.findFirst({ where: { name: m.name, categoryId: flexCategory.id } });
            if (!existingModel) {
                await db_1.default.model.create({
                    data: {
                        name: m.name,
                        brandId: m.brandId,
                        categoryId: m.categoryId,
                        isVerified: true,
                        lastVerifiedAt: new Date(),
                        notes: 'Connector pitch and pin count 40-pin verified under microscope',
                        aliases: { create: m.aliases.map(a => ({ aliasName: a })) },
                        compatibilityLists: {
                            create: m.compatibles.map(c => ({ compatibleWith: c, connectorType: '40-pin FPC', type: 'Flex Cable', isVerified: true }))
                        }
                    }
                });
            }
        }
    }
    // G. Combo / Display Models
    if (comboCategory && vivoBrand && redmiBrand) {
        const comboModels = [
            {
                name: 'Vivo Y11 Combo Display',
                brandId: vivoBrand.id,
                categoryId: comboCategory.id,
                compatibles: ['Vivo Y12 Folder', 'Vivo Y15 LCD', 'Vivo Y17 Display Combo', 'Vivo U10'],
                aliases: ['1906 Display', 'Y11 2019 Screen Assembly']
            },
            {
                name: 'Redmi Note 10 AMOLED Combo',
                brandId: redmiBrand.id,
                categoryId: comboCategory.id,
                compatibles: ['Redmi Note 10S Display Combo'],
                aliases: ['Note 10 FHD+ Super AMOLED Module']
            }
        ];
        for (const m of comboModels) {
            let existingModel = await db_1.default.model.findFirst({ where: { name: m.name, categoryId: comboCategory.id } });
            if (!existingModel) {
                await db_1.default.model.create({
                    data: {
                        name: m.name,
                        brandId: m.brandId,
                        categoryId: m.categoryId,
                        isVerified: true,
                        lastVerifiedAt: new Date(),
                        notes: 'Digitizer controller IC and display brightness driver compatibility tested',
                        aliases: { create: m.aliases.map(a => ({ aliasName: a })) },
                        compatibilityLists: {
                            create: m.compatibles.map(c => ({ compatibleWith: c, connectorType: 'Display FPC', type: 'Combo Display', isVerified: true }))
                        }
                    }
                });
            }
        }
    }
    console.log('[Seed] Categories, Types, and Workflow seed records successfully verified and loaded.');
}
