import * as z from "zod";

console.log("=== Zod v4 Direct Type Validators ===\n");

const emailSchema = z.email({ message: "Invalid email format" });
console.log("Testing z.email():");
console.log("Valid:", emailSchema.safeParse("user@example.com").success); // true
console.log("Invalid:", emailSchema.safeParse("not-an-email").success); // false

const uuidSchema = z.uuid({ message: "Invalid UUID format" });
console.log("\nTesting z.uuid():");
console.log("Valid:", uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success); // true
console.log("Invalid:", uuidSchema.safeParse("not-a-uuid").success); // false

const urlSchema = z.url({ message: "Invalid URL format" });
console.log("\nTesting z.url():");
console.log("Valid:", urlSchema.safeParse("https://example.com").success); // true
console.log("Invalid:", urlSchema.safeParse("not-a-url").success); // false

const numberSchema = z.number().min(0).max(100);
console.log("\nTesting z.number():");
console.log("Valid:", numberSchema.safeParse(50).success); // true
console.log("Invalid:", numberSchema.safeParse(150).success); // false

export const UserProfile = z.object({
  id: z.uuid(),
  email: z.email(),
  website: z.url().optional(),
  age: z.number().int().min(18),
  score: z.number().min(0).max(100),
  active: z.stringbool(), 
});

export type UserProfile = z.infer<typeof UserProfile>;

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "john@example.com",
  website: "https://john.dev",
  age: 25,
  score: 85.5,
  active: "true",
};

console.log("\n=== User Profile Validation ===");
const userResult = UserProfile.safeParse(validUser);
console.log("Valid user:", userResult.success);
if (userResult.success) {
  console.log("Parsed data:", userResult.data);
}

// Zod v4: Product Schema with validation
export const Product = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  website: z.url(),
  supplierEmail: z.email(),
  images: z.array(z.url()).max(5),
  rating: z.number().min(0).max(5),
});

export type Product = z.infer<typeof Product>;

// Zod v4: API Request/Response schemas
export const CreateUserRequest = z.object({
  email: z.email(),
  password: z.string().min(8),
  profileUrl: z.url().optional(),
  referralCode: z.uuid().optional(),
});

export const CreateUserResponse = z.object({
  userId: z.uuid(),
  email: z.email(),
  createdAt: z.string(),
});

// Zod v4: Configuration Schema
export const AppConfig = z.object({
  apiUrl: z.url(),
  adminEmail: z.email(),
  port: z.number().int().min(1000).max(65535),
  enableFeatures: z.stringbool(),
  sessionTimeout: z.number().positive(),
  allowedOrigins: z.array(z.url()),
});

export type AppConfig = z.infer<typeof AppConfig>;

// Zod v4: Form validation with all direct validators
export const ContactForm = z.object({
  id: z.uuid().optional(),
  name: z.string().min(2).max(50),
  email: z.email(),
  website: z.url().optional(),
  phone: z.string().min(10).max(15),
  message: z.string().min(10).max(1000),
  subscribe: z.stringbool(),
  rating: z.number().int().min(1).max(5),
});

export type ContactForm = z.infer<typeof ContactForm>;

export const Company = z.object({
  id: z.uuid(),
  name: z.string(),
  website: z.url(),
  employees: z.array(z.object({
    id: z.uuid(),
    email: z.email(),
    salary: z.number().positive(),
  })),
  contactEmail: z.email(),
  revenue: z.number().positive(),
});

export type Company = z.infer<typeof Company>;

// Zod v4: Union types with direct validators
export const Identifier = z.union([
  z.uuid(),
  z.email(),
  z.number().int().positive(),
]);

export type Identifier = z.infer<typeof Identifier>;

// Zod v4: Record with URL keys
export const SocialLinks = z.record(
  z.string(), // key: platform name
  z.url() // value: URL
);

export type SocialLinks = z.infer<typeof SocialLinks>;

// Example usage of various schemas
console.log("\n=== Testing Various Schemas ===");

const testProduct = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Laptop",
  price: 999.99,
  stock: 50,
  website: "https://example.com/laptop",
  supplierEmail: "supplier@example.com",
  images: ["https://example.com/img1.jpg"],
  rating: 4.5,
};

console.log("Product validation:", Product.safeParse(testProduct).success);

const testConfig = {
  apiUrl: "https://api.example.com",
  adminEmail: "admin@example.com",
  port: 3000,
  enableFeatures: "yes",
  sessionTimeout: 3600,
  allowedOrigins: ["https://app.example.com"],
};

console.log("Config validation:", AppConfig.safeParse(testConfig).success);

// Export validation utilities
export function validateEmail(email: unknown): boolean {
  return z.email().safeParse(email).success;
}

export function validateUuid(uuid: unknown): boolean {
  return z.uuid().safeParse(uuid).success;
}

export function validateUrl(url: unknown): boolean {
  return z.url().safeParse(url).success;
}

export function validateNumber(num: unknown, min?: number, max?: number): boolean {
  let schema = z.number();
  if (min !== undefined) schema = schema.min(min);
  if (max !== undefined) schema = schema.max(max);
  return schema.safeParse(num).success;
}

console.log("\n=== Validation Utilities ===");
console.log("Email valid:", validateEmail("test@example.com"));
console.log("UUID valid:", validateUuid("550e8400-e29b-41d4-a716-446655440000"));
console.log("URL valid:", validateUrl("https://example.com"));
console.log("Number in range:", validateNumber(50, 0, 100));
