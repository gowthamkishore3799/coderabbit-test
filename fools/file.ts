import * as z from "zod";

// Core User schema
export const User = z.object({
  id: z.string().uuid({ error: "Invalid id" }),
  email: z.string().email({ error: "Invalid email" }),
  age: z.coerce.number().int().min(18, { error: "Must be 18+" }),
  active: z.stringbool(), // parses "true/false", "1/0", "yes/no"
  role: z.enum(["admin", "user", "manager"]),
  website: z.url({ error: "Invalid url" }),
  websites: z.url(),
  trail: z.url(),
  trails: z
    .string()
    .refine((val) => val !== undefined && val.trim().length > 0, {
      error: "This field is required",
    }),
});

export type User = z.infer<typeof User>;

// Safe parsing hel
