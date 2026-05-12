import * as z from "zod"

/**
 * Core Zod v4 schema for validating a User object.
 * Enforces UUID id, email format, minimum age of 18, boolean-like active flag,
 * role enum, and URL validations for website, websites, and trail fields.
 */
export const User = z.object({
  id: z.string().uuid({ message: "Invalid id" }),
  email: z.string().email({ message: "Invalid email" }),
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }),

  // New helper in v4
  active: z.stringbool(), // parses "true/false", "1/0", "yes/no"

  role: z.enum(["admin", "user", "manager"]),

  // Top-level URL helpers introduced in v4
  website: z.url({ message: "Invalid url" }),
  websites: z.array(z.url({ message: "Invalid url" })),

  trail: z.url({ message: "Invalid url" }),

  trails: z.string().min(1, { message: "This field is required" }),
})

/** TypeScript type inferred from the User Zod schema. */
export type User = z.infer<typeof User>

/**
 * Safely parses and validates an unknown input against the User schema.
 *
 * @param input - The raw input to validate.
 * @returns The validated User data if parsing succeeds.
 * @throws {Error} Serialized Zod error tree if validation fails.
 */
export function parseUser(input: unknown) {
  const result = User.safeParse(input)
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.tree)) // v4 has .treeifyError()
  }
  return result.data
}
