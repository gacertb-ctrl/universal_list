"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('=== APP TS LOADED ===');
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const brand_routes_1 = __importDefault(require("./routes/brand.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const model_routes_1 = __importDefault(require("./routes/model.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const adSettings_routes_1 = __importDefault(require("./routes/adSettings.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
// Create Express app
const app = (0, express_1.default)();
// Global Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin)
            return callback(null, true);
        // In development mode or local environment, allow localhost origins
        if (process.env.NODE_ENV !== 'production' ||
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1')) {
            return callback(null, true);
        }
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
})); // CORS setup
app.use((0, morgan_1.default)('dev')); // HTTP request logger
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use((0, cookie_parser_1.default)());
// Rate limiting
const isDev = process.env.NODE_ENV === 'development';
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 1000, // Limit each IP to 10000 in dev or 1000 in prod per 15 minutes
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});
app.use('/api', limiter);
// Basic Route for health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Universal List 2026 API is running.' });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/brands', brand_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/models', model_routes_1.default);
app.use('/api/search', search_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/ad-settings', adSettings_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Print registered routes for debugging
app._router.stack.forEach((r) => {
    if (r.route) {
        console.log('Registered Route:', r.route.path);
    }
    else if (r.name === 'router') {
        console.log('Registered Router:', r.regexp);
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
exports.default = app;
