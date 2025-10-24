import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { initializeDatabase, pool, redis } from './database';

// Load environment variables
dotenv.config();

/**
 * Production-grade Express server with security, monitoring, and best practices
 */
class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configure middleware stack
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compression for responses
    this.app.use(compression());

    // Request logging
    if (process.env.NODE_ENV === 'production') {
      this.app.use(morgan('combined'));
    } else {
      this.app.use(morgan('dev'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Apply rate limiting to all API routes
    this.app.use('/api/', limiter);

    // Strict rate limiting for auth routes
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
      },
    });

    this.app.use('/api/users/login', authLimiter);
    this.app.use('/api/users/register', authLimiter);

    // Trust proxy (for rate limiting behind reverse proxy)
    if (process.env.NODE_ENV === 'production') {
      this.app.set('trust proxy', 1);
    }

    // Request ID middleware for tracing
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] ||
        `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      res.setHeader('X-Request-Id', req.headers['x-request-id']);
      next();
    });
  }

  /**
   * Configure application routes
   */
  private setupRoutes(): void {
    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'E-commerce API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          docs: '/api/docs',
        },
      });
    });

    // API routes
    this.app.use('/api', apiRoutes);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        path: req.path,
        message: 'The requested resource does not exist',
      });
    });
  }

  /**
   * Configure error handling
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.headers['x-request-id'],
        path: req.path,
        method: req.method,
      });

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'Something went wrong',
        requestId: req.headers['x-request-id'],
        ...(isDevelopment && { stack: error.stack }),
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // In production, you might want to log this to an error tracking service
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      // Gracefully shutdown
      this.shutdown();
    });

    // Handle termination signals
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      this.shutdown();
    });
  }

  /**
   * Initialize database and start server
   */
  public async start(): Promise<void> {
    try {
      console.log('Starting server initialization...');

      // Initialize database tables
      console.log('Initializing database...');
      await initializeDatabase();
      console.log('Database initialized successfully');

      // Test Redis connection
      console.log('Testing Redis connection...');
      await redis.ping();
      console.log('Redis connection successful');

      // Start listening
      this.app.listen(this.port, () => {
        console.log('');
        console.log('='.repeat(50));
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
        console.log(`Listening on port ${this.port}`);
        console.log(`API endpoint: http://localhost:${this.port}/api`);
        console.log(`Health check: http://localhost:${this.port}/api/health`);
        console.log('='.repeat(50));
        console.log('');
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    console.log('Shutting down gracefully...');

    try {
      // Close database connections
      await pool.end();
      console.log('Database connections closed');

      // Close Redis connection
      await redis.quit();
      console.log('Redis connection closed');

      console.log('Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express application instance
   */
  public getApp(): Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start();
}

export default Server;
