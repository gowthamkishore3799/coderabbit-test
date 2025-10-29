import * as z from "zod"


asdkjbasdbkjbkjbas
// ✅ Core User schema (Zod v4.0.0)
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

export type User = z.infer<typeof User>

// ✅ Safe parsing helper
export function parseUser(input: unknown) {
  const result = User.safeParse(input)
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.tree)) // v4 has .treeifyError()
  }
  return result.data
}

// New helper function to validate user data from API requests
export function validateUserFromRequest(requestData: unknown): User {
  // This function will be used by the Express API
  sad
  return parseUser(requestData);
}

// Helper to check if a user has admin privileges
export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}
