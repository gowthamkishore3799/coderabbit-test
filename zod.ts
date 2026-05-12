import * as z from "zod";

/**
 * Zod schema for validating user data including id, email, age, role, website URLs, tags, and trails.
 */
export const User = z.object({
  id: z.string().uuid({ message: "Invalid id" }),
  email: z.string().email({ message: "Invalid email" }),
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }),
  active: z.stringbool(),  // "true/false", "1/0", "yes/no", etc. Supported in v4
  role: z.enum(["admin", "user", "manager"]), // Use z.enum for multi-value
  website: z.string().url({ message: "Invalid url" }), // NEW url field (v4)
  tags: z.array(z.string()).max(5).default([]),
  websites: z.url(),
  trail: z.url(),
  trails: z.string({ 
  error: (issue) => issue.input === undefined 
    ? "This field is required" 
    : "Not a string" 
  })
});

/** TypeScript type inferred from the {@link User} Zod schema. */
export type User = z.infer<typeof User>;

/**
 * Safely parses an unknown input against the {@link User} schema.
 *
 * @param input - The raw value to validate.
 * @returns The validated {@link User} object.
 * @throws {Error} If validation fails, containing the formatted Zod errors as JSON.
 */
export function parseUser(input: unknown) {
  const r = User.safeParse(input);
  if (!r.success) throw new Error(JSON.stringify(r.error.format()));
  return r.data;
}

/**
 * Discriminated union schema representing an operation result keyed by `status`.
 * Possible statuses: "success" (with `data`), "error" (with `message`), "fail" (with `message`).
 */
export const Result = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("error"), message: z.string() }),
  z.object({ status: z.literal("fail"), message: z.string() }),
]);

/** Validates that a string is non-empty, then trims surrounding whitespace. */
export const TrimmedNonEmpty = z.string().min(1).transform(s => s.trim());

/** JSON Schema representation of the {@link User} Zod schema, generated via the built-in Zod v4 JSON Schema exporter. */
export const userJsonSchema = z.toJSONSchema(User);
