// user.schema.ts
import { z } from "zod"

/**
 * Pure Zod v4 schema for validating user objects.
 * Validates id (UUID), email, age (min 18), active (stringbool), role/status (enums),
 * a template-literal code, a strict profile object, and multiple URL fields.
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

/** TypeScript type inferred from the {@link UserSchema} Zod schema. */
export type User = z.infer<typeof UserSchema>

/**
 * Safely parses an unknown input against the {@link UserSchema}.
 *
 * @param input - The raw value to validate.
 * @returns The validated {@link User} object.
 * @throws {Error} If validation fails, containing the Zod treeified error as JSON.
 */
export function parseUser(input: unknown): User {
  const result = UserSchema.safeParse(input)
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify())) // v4 structured error
  }
  return result.data
}
