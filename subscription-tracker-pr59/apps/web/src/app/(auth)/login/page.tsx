"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@subscription-tracker/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { type LoginFormData, loginSchema } from "@/lib/validations/auth";

const LoginPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await login(data);

      // Call Next.js API route to store JWT in httpOnly cookie
      const sessionResponse = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: response.token }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to create session");
      }

      // Redirect to home page after successful login
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="main">
      <div className="container">
        <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center py-12">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h1 className="mb-2 text-4xl font-bold">Login</h1>
              <p className="text-muted-foreground">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && <div className="bg-destructive/10 text-destructive rounded-md p-4 text-sm">{error}</div>}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm leading-none font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-destructive text-sm" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm leading-none font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter your password"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                {errors.password && (
                  <p id="password-error" className="text-destructive text-sm" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-muted-foreground text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-primary font-medium underline-offset-4 hover:underline">
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
