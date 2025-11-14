import { z } from 'zod';

// Invalid Zod usage: using .validate() which doesn't exist
// Zod uses .parse() or .safeParse() instead
export function validateUser(data: unknown) {
  const userSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  // This is invalid - Zod schemas don't have a .validate() method
  return userSchema.validate(data);
}
