import { z } from "zod"

userSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
})
