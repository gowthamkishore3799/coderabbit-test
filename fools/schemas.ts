import { z } from 'zod';

/**
 * User validation schemas
 */
export const CreateUserSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must not exceed 30 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  firstName: z.string().min(1, { message: 'First name is required' }).max(50),
  lastName: z.string().min(1, { message: 'Last name is required' }).max(50),
  age: z.number().int().min(18, { message: 'Must be at least 18 years old' }).max(120).optional(),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
    .optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export const LoginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

/**
 * Product validation schemas
 */
export const CreateProductSchema = z.object({
  name: z.string()
    .min(3, { message: 'Product name must be at least 3 characters' })
    .max(200, { message: 'Product name must not exceed 200 characters' }),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(2000, { message: 'Description must not exceed 2000 characters' }),
  price: z.number()
    .positive({ message: 'Price must be a positive number' })
    .multipleOf(0.01, { message: 'Price must have at most 2 decimal places' }),
  stock: z.number()
    .int({ message: 'Stock must be an integer' })
    .nonnegative({ message: 'Stock cannot be negative' }),
  category: z.enum(['electronics', 'clothing', 'food', 'books', 'home', 'sports', 'other'], {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  sku: z.string()
    .regex(/^[A-Z0-9]{6,12}$/, { message: 'SKU must be 6-12 uppercase letters or numbers' }),
  tags: z.array(z.string()).max(10, { message: 'Maximum 10 tags allowed' }).optional(),
  isActive: z.boolean().default(true),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: 'minPrice must be less than or equal to maxPrice', path: ['minPrice'] }
);

/**
 * Order validation schemas
 */
export const CreateOrderSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  items: z.array(
    z.object({
      productId: z.string().uuid({ message: 'Invalid product ID format' }),
      quantity: z.number()
        .int({ message: 'Quantity must be an integer' })
        .positive({ message: 'Quantity must be positive' })
        .max(100, { message: 'Maximum quantity per item is 100' }),
      price: z.number().positive(),
    })
  ).min(1, { message: 'Order must contain at least one item' }),
  shippingAddress: z.object({
    street: z.string().min(5, { message: 'Street address is required' }),
    city: z.string().min(2, { message: 'City is required' }),
    state: z.string().min(2, { message: 'State is required' }),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, { message: 'Invalid ZIP code format' }),
    country: z.string().length(2, { message: 'Country code must be 2 characters' }),
  }),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer'], {
    errorMap: () => ({ message: 'Invalid payment method' })
  }),
}).refine(
  (data) => {
    const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return totalAmount > 0;
  },
  { message: 'Order total must be greater than 0' }
);

export const OrderStatusSchema = z.enum([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]);

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  notes: z.string().max(500).optional(),
});

/**
 * Type exports for TypeScript
 */
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
