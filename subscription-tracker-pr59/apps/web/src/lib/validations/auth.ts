import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Invalid email format" }),
  password: z
    .string({
      error: (issue) => (issue.input === undefined ? "Password is required" : "Password must be a string"),
    })
    .min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.email({ error: "Invalid email format" }),
    password: z
      .string({
        error: (issue) => (issue.input === undefined ? "Password is required" : "Password must be a string"),
      })
      .min(8, { error: "Password must be at least 8 characters" })
      .max(100, { error: "Password must be less than 100 characters" })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain at least one lowercase, one uppercase, one digit and one special character"
      ),
    firstName: z
      .string({
        error: (issue) => (issue.input === undefined ? "First name is required" : "First name must be a string"),
      })
      .regex(/^[A-Z][a-z]*$/, "First name must start with capital letter and contain only letters"),
    lastName: z
      .string({
        error: (issue) => (issue.input === undefined ? "Last name is required" : "Last name must be a string"),
      })
      .regex(/^[A-Z][a-z]*$/, "Last name must start with capital letter and contain only letters"),
  })
  .refine((data) => data.password.length >= 8, {
    message: "Password must be at least 8 characters",
    path: ["password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
