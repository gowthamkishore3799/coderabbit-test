import { Pool, PoolClient, QueryResult } from 'pg';
import Redis from 'ioredis';
import type { CreateUserInput, CreateProductInput, CreateOrderInput, UpdateProductInput, OrderStatus } from './schemas';

/**
 * PostgreSQL Database Configuration
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ecommerce_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Redis Cache Configuration
 */
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Database initialization - creates tables if they don't exist
 */
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(30) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        age INTEGER,
        phone_number VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        category VARCHAR(50) NOT NULL,
        sku VARCHAR(12) UNIQUE NOT NULL,
        tags TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_address JSONB NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    `);

    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    `);

    await client.query('COMMIT');
    console.log('Database tables initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * User Database Operations
 */
export const UserDB = {
  async create(userData: CreateUserInput & { passwordHash: string }): Promise<any> {
    const { email, username, passwordHash, firstName, lastName, age, phoneNumber } = userData;

    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name, age, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, username, first_name, last_name, age, phone_number, created_at`,
      [email, username, passwordHash, firstName, lastName, age, phoneNumber]
    );

    const user = result.rows[0];

    // Cache user in Redis
    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(user));

    return user;
  },

  async findByEmail(email: string): Promise<any | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<any | null> {
    // Try cache first
    const cached = await redis.get(`user:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await pool.query(
      'SELECT id, email, username, first_name, last_name, age, phone_number, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows[0]) {
      await redis.setex(`user:${id}`, 3600, JSON.stringify(result.rows[0]));
    }

    return result.rows[0] || null;
  },

  async updateLastLogin(userId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  },
};

/**
 * Product Database Operations
 */
export const ProductDB = {
  async create(productData: CreateProductInput): Promise<any> {
    const { name, description, price, stock, category, sku, tags, isActive } = productData;

    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category, sku, tags, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, price, stock, category, sku, tags || [], isActive]
    );

    const product = result.rows[0];

    // Cache product
    await redis.setex(`product:${product.id}`, 1800, JSON.stringify(product));

    // Invalidate product list cache
    await redis.del('products:list:*');

    return product;
  },

  async findById(id: string): Promise<any | null> {
    // Try cache first
    const cached = await redis.get(`product:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows[0]) {
      await redis.setex(`product:${id}`, 1800, JSON.stringify(result.rows[0]));
    }

    return result.rows[0] || null;
  },

  async update(id: string, updates: UpdateProductInput): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows[0]) {
      // Update cache
      await redis.setex(`product:${id}`, 1800, JSON.stringify(result.rows[0]));
      // Invalidate list cache
      await redis.del('products:list:*');
    }

    return result.rows[0] || null;
  },

  async findAll(filters: any = {}): Promise<any[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters.category) {
      conditions.push(`category = $${paramCount}`);
      values.push(filters.category);
      paramCount++;
    }

    if (filters.minPrice !== undefined) {
      conditions.push(`price >= $${paramCount}`);
      values.push(filters.minPrice);
      paramCount++;
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(`price <= $${paramCount}`);
      values.push(filters.maxPrice);
      paramCount++;
    }

    if (filters.inStock) {
      conditions.push('stock > 0');
    }

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = `ORDER BY ${filters.sortBy || 'created_at'} ${filters.sortOrder || 'DESC'}`;
    const limit = filters.limit || 20;
    const offset = ((filters.page || 1) - 1) * limit;

    const query = `SELECT * FROM products ${whereClause} ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  async decreaseStock(productId: string, quantity: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND stock >= $1 RETURNING *`,
      [quantity, productId]
    );

    if (result.rows[0]) {
      await redis.del(`product:${productId}`);
      return true;
    }

    return false;
  },
};

/**
 * Order Database Operations
 */
export const OrderDB = {
  async create(orderData: CreateOrderInput): Promise<any> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Calculate total
      const totalAmount = orderData.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [orderData.userId, totalAmount, JSON.stringify(orderData.shippingAddress), orderData.paymentMethod, 'pending']
      );

      const order = orderResult.rows[0];

      // Create order items and decrease stock
      for (const item of orderData.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.productId, item.quantity, item.price]
        );

        // Decrease product stock
        const stockResult = await client.query(
          `UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND stock >= $1 RETURNING *`,
          [item.quantity, item.productId]
        );

        if (stockResult.rows.length === 0) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        // Invalidate product cache
        await redis.del(`product:${item.productId}`);
      }

      await client.query('COMMIT');

      // Cache order
      await redis.setex(`order:${order.id}`, 1800, JSON.stringify(order));

      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findById(id: string): Promise<any | null> {
    const cached = await redis.get(`order:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await pool.query(
      `SELECT o.*,
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'quantity', oi.quantity,
                  'price', oi.price
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );

    if (result.rows[0]) {
      await redis.setex(`order:${id}`, 1800, JSON.stringify(result.rows[0]));
    }

    return result.rows[0] || null;
  },

  async updateStatus(orderId: string, status: OrderStatus, notes?: string): Promise<any | null> {
    const result = await pool.query(
      `UPDATE orders SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status, notes, orderId]
    );

    if (result.rows[0]) {
      await redis.del(`order:${orderId}`);
    }

    return result.rows[0] || null;
  },

  async findByUserId(userId: string, limit = 20, offset = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  },
};

/**
 * Health check functions
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

export { pool, redis };
