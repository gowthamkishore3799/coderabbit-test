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
