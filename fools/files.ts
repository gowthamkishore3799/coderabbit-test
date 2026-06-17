// user.schema.ts
import { z } from "zod"

/**
 * Pure Zod v4 schema for validating a User object with extended fields.
 * Includes UUID id, email, coerced age, boolean-like active flag, role/status enums,
 * template literal code pattern, strict profile object, and URL fields.
 */
export const UserSchema = z.object({
  id: z.uuid({ message: "Invalid ID" }), // top-level uuid
  email: z.email({ message: "Invalid email" }), // top-level email
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }), // coercion namespace

  active: z.stringbool(), // parses "true/false", "1/0", "yes/no"

  role: z.enum(["admin", "user", "manager"]), // v4 enum

  status: z.enum(["active", "inactive", "banned"]),

  code: z.templateLiteral([ // template literal schema
    z.literal("user-"),
    z.number().min(1).max(9999),
  ]),

  profile: z.strictObject({ // strict object
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),
  portfolio: z.url(),
  siteUrls: z.urls(),
  format: z.string(),
})

/** TypeScript type inferred from the UserSchema Zod schema. */
export type User = z.infer<typeof UserSchema>

/**
 * Safely parses and validates an unknown input against the UserSchema.
 *
 * @param input - The raw input to validate.
 * @returns The validated User data if parsing succeeds.
 * @throws {Error} JSON-serialized treeified Zod error if validation fails.
 */
export function parseUser(input: unknown): User {
  const result = UserSchema.safeParse(input)
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify())) // v4 structured error
  }
  return result.data
}

