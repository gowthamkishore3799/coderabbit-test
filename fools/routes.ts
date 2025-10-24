import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod';
import {
  CreateUserSchema,
  LoginSchema,
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
  CreateOrderSchema,
  UpdateOrderStatusSchema,
} from './schemas';
import { UserDB, ProductDB, OrderDB } from './database';

const router = Router();

/**
 * Middleware for request validation using Zod schemas
 */
function validateRequest(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware for query parameter validation
 */
function validateQuery(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware for JWT authentication
 */
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Error handler middleware
 */
function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', error);

  if (error.message.includes('duplicate key')) {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}

// ==================== USER ROUTES ====================

/**
 * POST /api/users/register - Register a new user
 */
router.post(
  '/users/register',
  validateRequest(CreateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password, ...userData } = req.body;

      // Check if user already exists
      const existingUser = await UserDB.findByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await UserDB.create({ ...userData, passwordHash });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/users/login - User login
 */
router.post(
  '/users/login',
  validateRequest(LoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserDB.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Update last login
      await UserDB.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/me - Get current user profile
 */
router.get('/users/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const user = await UserDB.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PRODUCT ROUTES ====================

/**
 * POST /api/products - Create a new product (authenticated)
 */
router.post(
  '/products',
  authenticate,
  validateRequest(CreateProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductDB.create(req.body);

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/products - Get all products with filtering and pagination
 */
router.get(
  '/products',
  validateQuery(ProductQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await ProductDB.findAll(req.query);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: (req.query as any).page || 1,
          limit: (req.query as any).limit || 20,
          total: products.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/products/:id - Get a single product by ID
 */
router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await ProductDB.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/products/:id - Update a product (authenticated)
 */
router.patch(
  '/products/:id',
  authenticate,
  validateRequest(UpdateProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductDB.update(req.params.id, req.body);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== ORDER ROUTES ====================

/**
 * POST /api/orders - Create a new order (authenticated)
 */
router.post(
  '/orders',
  authenticate,
  validateRequest(CreateOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      // Verify user exists
      const user = await UserDB.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Verify all products exist and have sufficient stock
      for (const item of req.body.items) {
        const product = await ProductDB.findById(item.productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            error: `Product ${item.productId} not found`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          });
        }

        // Set the current price
        item.price = product.price;
      }

      // Create order with userId from token
      const orderData = { ...req.body, userId };
      const order = await OrderDB.create(orderData);

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orders/:id - Get order by ID (authenticated)
 */
router.get(
  '/orders/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderDB.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Check if user owns this order
      const userId = (req as any).user.userId;
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orders - Get all orders for current user (authenticated)
 */
router.get('/orders', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const orders = await OrderDB.findByUserId(userId, limit, offset);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: orders.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/orders/:id/status - Update order status (authenticated)
 */
router.patch(
  '/orders/:id/status',
  authenticate,
  validateRequest(UpdateOrderStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderDB.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Check if user owns this order
      const userId = (req as any).user.userId;
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      const { status, notes } = req.body;
      const updatedOrder = await OrderDB.updateStatus(req.params.id, status, notes);

      res.json({
        success: true,
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== HEALTH CHECK ROUTE ====================

/**
 * GET /api/health - Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  const { checkDatabaseHealth, checkRedisHealth } = await import('./database');

  const dbHealthy = await checkDatabaseHealth();
  const redisHealthy = await checkRedisHealth();

  const status = dbHealthy && redisHealthy ? 'healthy' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'down',
    },
  });
});

// Apply error handler
router.use(errorHandler);

export default router;
