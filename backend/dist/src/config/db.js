"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
function getDatabaseUrl() {
    let url = process.env.DATABASE_URL;
    // If DATABASE_URL is not set but individual DB_* vars are present
    if (!url && process.env.DB_HOST) {
        const user = encodeURIComponent(process.env.DB_USERNAME || '');
        const pass = encodeURIComponent(process.env.DB_PASSWORD || '');
        const host = process.env.DB_HOST;
        const port = process.env.DB_PORT || '3306';
        const db = process.env.DB_DATABASE || 'universal_list';
        url = `mysql://${user}:${pass}@${host}:${port}/${db}`;
    }
    // Ensure TiDB Cloud or secure cloud hosts always have sslaccept=strict
    if (url && (url.includes('tidbcloud.com') || process.env.DB_HOST?.includes('tidbcloud.com'))) {
        if (!url.includes('sslaccept=') && !url.includes('sslmode=') && !url.includes('ssl=')) {
            url += (url.includes('?') ? '&' : '?') + 'sslaccept=strict';
        }
    }
    return url || '';
}
const resolvedUrl = getDatabaseUrl();
if (resolvedUrl) {
    process.env.DATABASE_URL = resolvedUrl;
}
const prisma = new client_1.PrismaClient({
    datasources: resolvedUrl
        ? {
            db: {
                url: resolvedUrl,
            },
        }
        : undefined,
    log: ['error'],
});
exports.default = prisma;
