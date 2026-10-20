import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

console.log('=== APP TS LOADED ===');
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import brandRoutes from './routes/brand.routes';
import categoryRoutes from './routes/category.routes';
import modelRoutes from './routes/model.routes';
import searchRoutes from './routes/search.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adSettingsRoutes from './routes/adSettings.routes';
import adminRoutes from './routes/admin.routes';

// Create Express app
const app: Express = express();

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // In development mode or local environment, allow localhost origins
    if (
      process.env.NODE_ENV !== 'production' || 
      origin.startsWith('http://localhost') || 
      origin.startsWith('http://127.0.0.1')
    ) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean) as string[];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
})); // CORS setup

app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());

// Rate limiting
const isDev = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
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
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Universal List 2026 API is running.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ad-settings', adSettingsRoutes);
app.use('/api/admin', adminRoutes);

// Print registered routes for debugging
app._router.stack.forEach((r: any) => {
  if (r.route) {
    console.log('Registered Route:', r.route.path);
  } else if (r.name === 'router') {
    console.log('Registered Router:', r.regexp);
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
