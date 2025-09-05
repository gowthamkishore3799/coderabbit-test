import * as z from "zod";

// Core schema (v4 features used below)
export const User = z.object({
  id: z.string().uuid({ error: "Invalid id" }),
  email: z.string().email({ error: "Invalid email" }),
  age: z.coerce.number().int().min(18, { error: "Must be 18+" }),
  active: z.stringbool(),                          // "true/false", "1/0", "yes/no", etc.
  role: z.literal(["admin", "user", "manager"]),   // multi-literal (v4)
  tags: z.array(z.string()).max(5).default([]),
});
export type User = z.infer<typeof User>;

// Safe parsing
export function parseUser(input: unknown) {
  const r = User.safeParse(input);
  if (!r.success) throw new Error(JSON.stringify(r.error.format()));
  return r.data;
}

// Discriminated union (v4: unions/pipes allowed as discriminator)
export const Result = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({
    status: z.union([z.literal("error"), z.literal("fail")]),
    message: z.string(),
  }),
]);

// Type-preserving transform (v4)
export const TrimmedNonEmpty = z.string().overwrite(s => s.trim()).min(1);

// Built-in JSON Schema export (v4)
export const userJsonSchema = z.toJSONSchema(User);
