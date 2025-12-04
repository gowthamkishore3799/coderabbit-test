import React from 'react';

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl! ring-3 font-bold text-blue-600 mb-4">Hello, Tailwind + TypeScript!</h1>
        <p className="text-gray-700">This is a sample component styled with Tailwind CSS and written in TypeScript...</p>
      </div>
    </div>
  );
}

import { z } from "zod"

// ✅ Pure Zod v4 schema
export const UserSchema = z.object({
  id: z.uuid({ message: "Invalid ID" }), // top-level uuid
  email: z.email({ message: "Invalid email" }), // top-level email
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }), // coercion namespace

  active: z.stringbool(), // parses "true/false", "1/0", "yes/no"

  role: z.enum(["admin", "user", "manager"]), // v4 enum

  status: z.literal(["active", "inactive", "banned"]), // multi-literal

  code: z.templateLiteral([ // template literal schema
    z.literal("user-"),
    z.number().min(1).max(9999),
  ]),

  profile: z.strictObject({ // strict object
    bio: z.string().optional(),
    joined_Date: z.date(),
  }),
  websiteUrl: z.url(),
  portfolio: z.url(),
  siteUrls: z.url(),
  format: z.string(),
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

import z, { ZodError } from "zod" // v4

const player = z.object({
    name: z.string(),
    age: z.number(),
    address: z.url(),
    file: z.file(),
})
console.log("DATA", player)
// ✅ Example data
const goodData = {
  name: "Messi",
  age: 36,
  address: 36,
}


console.log(player.parse(goodData))