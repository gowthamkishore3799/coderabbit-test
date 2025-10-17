import * as z from "zod";

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

export type User = z.infer<typeof User>;

// Safe parsing
export function parseUser(input: unknown) {
  const r = User.safeParse(input);
  if (!r.success) throw new Error(JSON.stringify(r.error.format()));
  return r.data;
}

// Discriminated union, each status as a separate literal
export const Result = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("error"), message: z.string() }),
  z.object({ status: z.literal("fail"), message: z.string() }),
]);

// Type-preserving transform (use .transform())
export const TrimmedNonEmpty = z.string().transform(s => s.trim()).min(1);

// Built-in JSON Schema export (v4)
export const userJsonSchema = z.toJSONSchema(User);
