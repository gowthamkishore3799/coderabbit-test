import * as z from "zod";

// Zod 4 Feature: Direct type validators (z.email, z.uuid, z.url, z.number)
export const AdvancedUser = z.object({
  id: z.uuid({ message: "Invalid UUID format" }), // Zod 4: Direct z.uuid()
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, {
    message: "Username must contain only letters, numbers, and underscores"
  }),
  email: z.email({ message: "Invalid email address" }), // Zod 4: Direct z.email()
  phone: z.string().min(10).max(15), // Phone validation
  website: z.url({ message: "Invalid URL" }), // Zod 4: Direct z.url()
  age: z.number().int().min(18).max(120), // Zod 4: Direct z.number()
  isActive: z.stringbool(), // Zod 4: Parse boolean strings
  role: z.enum(["admin", "user", "moderator", "guest"]),
  tags: z.array(z.string()).max(10).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AdvancedUser = z.infer<typeof AdvancedUser>;

// Zod 4 Feature: Advanced discriminated unions
export const ApiResponse = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("success"),
    data: z.any(),
    timestamp: z.string(),
  }),
  z.object({
    type: z.literal("error"),
    error: z.string(),
    code: z.number(),
    timestamp: z.string(),
  }),
  z.object({
    type: z.literal("loading"),
    progress: z.number().min(0).max(100),
  }),
]);

export type ApiResponse = z.infer<typeof ApiResponse>;

// Zod 4 Feature: Branded types for type safety using direct validators
export const UserId = z.uuid().brand("UserId"); // Zod 4: Direct z.uuid()
export const Email = z.email().brand("Email"); // Zod 4: Direct z.email()
export const Timestamp = z.number().int().positive().brand("Timestamp");
export const userEmail = z.email();

export type UserId = z.infer<typeof UserId>;
export type Email = z.infer<typeof Email>;
export type Timestamp = z.infer<typeof Timestamp>;

// Zod 4 Feature: Pipe for chaining transformations
export const NormalizedEmail = z.email()
  .transform(email => email.toLowerCase())
  .transform(email => email.trim())
  .pipe(Email);

// Zod 4 Feature: Advanced date validation
export const EventSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  location: z.string().optional(),
  attendees: z.array(z.email()).min(1), // Zod 4: Direct z.email()
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type Event = z.infer<typeof EventSchema>;

// Zod 4 Feature: JSON Schema generation
export const userJsonSchema = z.toJSONSchema(AdvancedUser);
export const apiResponseJsonSchema = z.toJSONSchema(ApiResponse);

// Zod 4 Feature: Custom error messages with context
export const PasswordSchema = z.string({
  error: (issue) => {
    if (issue.input === undefined) {
      return "Password is required";
    }
    return "Password must be a string";
  }
}).min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" });

// Utility function for safe parsing with better error handling
export function safeParse<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const formattedErrors = result.error.format();
    throw new Error(`Validation failed: ${JSON.stringify(formattedErrors, null, 2)}`);
  }
  return result.data;
}

// Utility function for async validation
export async function safeParseAsync<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): Promise<T> {
  const result = await schema.safeParseAsync(input);
  if (!result.success) {
    const formattedErrors = result.error.format();
    throw new Error(`Async validation failed: ${JSON.stringify(formattedErrors, null, 2)}`);
  }
  return result.data;
}

// Zod 4 Feature: Partial and Pick utilities
export const PartialUser = AdvancedUser.partial();
export const UserCredentials = AdvancedUser.pick({ email: true, username: true });
export const PublicUser = AdvancedUser.omit({ role: true, metadata: true });

export type PartialUser = z.infer<typeof PartialUser>;
export type UserCredentials = z.infer<typeof UserCredentials>;
export type PublicUser = z.infer<typeof PublicUser>;

// Zod 4 Feature: Enhanced number validation with finite checks
export const PriceSchema = z.number()
  .finite({ message: "Price must be a finite number" })
  .positive({ message: "Price must be positive" })
  .multipleOf(0.01, { message: "Price must have at most 2 decimal places" });

export const QuantitySchema = z.number()
  .int({ message: "Quantity must be an integer" })
  .nonnegative({ message: "Quantity cannot be negative" })
  .safe({ message: "Quantity must be within safe integer range" });

// Zod 4 Feature: Advanced string validators
export const SlugSchema = z.string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must be lowercase alphanumeric with hyphens"
  })
  .min(3)
  .max(50);

export const HexColorSchema = z.string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Must be a valid hex color"
  });

// Zod 4 Feature: IP address validation
export const IpAddressSchema = z.string().ip({
  version: "v4",
  message: "Invalid IPv4 address"
});

export const IpV6Schema = z.string().ip({
  version: "v6",
  message: "Invalid IPv6 address"
});

// Zod 4 Feature: Date string validation with custom constraints
export const DateOfBirthSchema = z.string().date()
  .refine(dateStr => {
    const date = new Date(dateStr);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120;
  }, {
    message: "Must be between 13 and 120 years old"
  });

// Zod 4 Feature: Time and datetime validation
export const TimeSchema = z.string().time({
  precision: 3,
  message: "Invalid time format (expected HH:MM:SS.sss)"
});

export const DateTimeSchema = z.string().datetime({
  offset: true,
  precision: 3,
  message: "Invalid ISO 8601 datetime with timezone offset"
});

// Zod 4 Feature: CUID and ULID support
export const CuidSchema = z.string().cuid({
  message: "Invalid CUID format"
});

export const CuidV2Schema = z.string().cuid2({
  message: "Invalid CUID v2 format"
});

export const UlidSchema = z.string().ulid({
  message: "Invalid ULID format"
});

// Zod 4 Feature: Duration validation
export const DurationSchema = z.string().duration({
  message: "Invalid ISO 8601 duration format"
});

// Zod 4 Feature: Advanced tuple with rest
export const CoordinatesWithMetadata = z.tuple([
  z.number(), // latitude
  z.number(), // longitude
  z.number().optional() // altitude
]).rest(z.string()); // additional metadata as strings

// Zod 4 Feature: Readonly schemas
export const ImmutableConfig = z.object({
  apiKey: z.string(),
  environment: z.enum(["dev", "staging", "production"]),
  features: z.array(z.string())
}).readonly();

export type ImmutableConfig = z.infer<typeof ImmutableConfig>;

// Zod 4 Feature: Advanced intersection types
export const TimestampMixin = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const SoftDeleteMixin = z.object({
  deletedAt: z.string().datetime().nullable()
});

export const AuditedEntity = z.object({
  id: z.uuid(),
  name: z.string()
}).and(TimestampMixin).and(SoftDeleteMixin);

export type AuditedEntity = z.infer<typeof AuditedEntity>;

// Zod 4 Feature: Catch with fallback values
export const SafeNumberArray = z.array(
  z.number().catch(0) // Invalid numbers default to 0
);

export const SafeJsonParse = z.string()
  .transform(str => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  })
  .pipe(z.unknown());

// Zod 4 Feature: Superrefine for complex validations
export const StrongPasswordSchema = z.string().superRefine((val, ctx) => {
  const checks = [
    { test: val.length >= 12, message: "Password must be at least 12 characters" },
    { test: /[A-Z]/.test(val), message: "Must contain uppercase letter" },
    { test: /[a-z]/.test(val), message: "Must contain lowercase letter" },
    { test: /[0-9]/.test(val), message: "Must contain number" },
    { test: /[^A-Za-z0-9]/.test(val), message: "Must contain special character" },
    { test: !/(.)\1{2,}/.test(val), message: "Cannot contain 3+ repeated characters" }
  ];

  checks.forEach(({ test, message }) => {
    if (!test) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        fatal: false
      });
    }
  });
});

// Zod 4 Feature: Preprocess with validation
export const TrimmedNonEmptyString = z.preprocess(
  (val) => typeof val === "string" ? val.trim() : val,
  z.string().min(1, "String cannot be empty after trimming")
);

export const ParsedInteger = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  },
  z.number().int()
);

// Zod 4 Feature: Lazy evaluation for recursive schemas
export const CategorySchema: z.ZodType<{
  id: string;
  name: string;
  subcategories?: Array<{
    id: string;
    name: string;
    subcategories?: any;
  }>;
}> = z.lazy(() =>
  z.object({
    id: z.uuid(),
    name: z.string().min(1),
    subcategories: z.array(CategorySchema).optional()
  })
);

export type Category = z.infer<typeof CategorySchema>;

// Zod 4 Feature: Custom error map for better error messages
export const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: `Expected text, but received ${issue.received}` };
    }
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === "string") {
      return { message: `Text is too short (minimum: ${issue.minimum} characters)` };
    }
  }
  return { message: ctx.defaultError };
};

// Zod 4 Feature: Schema with custom error map
export const ProductSchema = z.object({
  id: z.uuid(),
  name: z.string().min(3).max(100),
  price: PriceSchema,
  quantity: QuantitySchema,
  sku: z.string().regex(/^[A-Z0-9-]+$/, "SKU must be uppercase alphanumeric with hyphens"),
  category: z.string(),
  tags: z.array(z.string()).min(1).max(10),
  color: HexColorSchema.optional(),
  slug: SlugSchema,
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(["cm", "in", "m"])
  }).optional()
}, { errorMap: customErrorMap });

export type Product = z.infer<typeof ProductSchema>;

// Zod 4 Feature: Additional primitive types
export const BigIntSchema = z.bigint({
  message: "Must be a BigInt value"
});

export const BooleanSchema = z.boolean({
  message: "Must be a boolean value"
});

export const SymbolSchema = z.symbol({
  message: "Must be a symbol"
});

export const UndefinedSchema = z.undefined();

export const NullSchema = z.null();

// Zod 4 Feature: Complex combinations with primitives
export const OptionalNullableString = z.string().nullable().optional();

export const BigIntRangeSchema = z.bigint()
  .min(0n, { message: "BigInt must be non-negative" })
  .max(1000000000000000n, { message: "BigInt exceeds maximum value" });

// Zod 4 Feature: Union with primitives
export const PrimitiveUnion = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.bigint(),
  z.null(),
  z.undefined()
]);

export type PrimitiveUnion = z.infer<typeof PrimitiveUnion>;

// Zod 4 Feature: Nullable and optional combinations
export const ConfigValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
]).describe("Configuration value that can be string, number, boolean, or null");

export const OptionalConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.number().int().positive().default(3000),
  ssl: z.boolean().default(false),
  timeout: z.number().positive().optional(),
  maxRetries: z.number().int().nonnegative().nullable(),
  customHeader: z.string().nullable().default(null),
  verboseLogging: z.boolean().optional(),
  apiKey: z.string().or(z.undefined()),
  secret: z.symbol().optional()
});

export type OptionalConfig = z.infer<typeof OptionalConfigSchema>;
