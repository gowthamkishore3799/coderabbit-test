// user.schema.ts
import { z } from "zod"

// ✅ Pure Zod v4 schema
export const UserSchema = z.object({
  id: z.uuid({ message: "Invalid ID" }), // top-level uuid
  email: z.email({ message: "Invalid email" }), // top-level email
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }), // coercion namespace

  active: z.stringbool(), // parses "true/false", "1/0", "yes/no"

  role: z.enum(["admin", "user", "manager"]), // v4 enum

  website: z.url({ message: "Invalid URL" }), // top-level url

  status: z.literal(["active", "inactive", "banned"]), // multi-literal

  code: z.templateLiteral([ // template literal schema
    z.literal("user-"),
    z.number().min(1).max(9999),
  ]),

  profile: z.strictObject({ // strict object
    bio: z.string().optional(),
    joined: z.date(),
  }),
})

// ✅ TypeScript inference
export type User = z.infer<typeof UserSchema>

// ✅ Safe parsing with v4 error helpers
export function parseUser(input: unknown): User {
  const result = UserSchema.safeParse(input)
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify())) // v4 structured error
  }
  return result.data
}

