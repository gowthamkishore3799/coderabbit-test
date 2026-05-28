/**
 * Input validation utilities for common data types
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface EmailValidationOptions {
  allowSubaddressing: boolean;
  maxLength: number;
  blockedDomains: string[];
}

const DEFAULT_EMAIL_OPTIONS: EmailValidationOptions = {
  allowSubaddressing: true,
  maxLength: 254,
  blockedDomains: ["tempmail.com", "throwaway.email"],
};

export function validateEmail(
  email: string,
  options: Partial<EmailValidationOptions> = {}
): ValidationResult {
  const opts = { ...DEFAULT_EMAIL_OPTIONS, ...options };
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    return { valid: false, errors: ["Email is required"] };
  }

  if (email.length > opts.maxLength) {
    errors.push(`Email must be less than ${opts.maxLength} characters`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  if (!opts.allowSubaddressing && email.includes("+")) {
    errors.push("Sub-addressing (plus addressing) is not allowed");
  }

  const domain = email.split("@")[1]?.toLowerCase();
  if (domain && opts.blockedDomains.includes(domain)) {
    errors.push(`Domain "${domain}" is not allowed`);
  }

  return { valid: errors.length === 0, errors };
}

interface PasswordStrength {
  score: number; // 0-4
  label: "very_weak" | "weak" | "fair" | "strong" | "very_strong";
  suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;

  // Cap at 4
  score = Math.min(score, 4);

  if (password.length < 8) suggestions.push("Use at least 8 characters");
  if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters");
  if (!/[a-z]/.test(password)) suggestions.push("Add lowercase letters");
  if (!/\d/.test(password)) suggestions.push("Add numbers");
  if (!/[!@#$%^&*]/.test(password)) suggestions.push("Add special characters");

  const labels: PasswordStrength["label"][] = [
    "very_weak",
    "weak",
    "fair",
    "strong",
    "very_strong",
  ];

  return { score, label: labels[score], suggestions };
}

export function validateURL(url: string): ValidationResult {
  const errors: string[] = [];

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      errors.push("Only HTTP and HTTPS protocols are allowed");
    }
  } catch {
    errors.push("Invalid URL format");
  }

  return { valid: errors.length === 0, errors };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface PhoneValidationOptions {
  country?: "US" | "UK" | "IN";
  allowFormatting?: boolean;
}

export function validatePhone(
  phone: string,
  options: PhoneValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const digits = phone.replace(/\D/g, "");

  const patterns: Record<string, { regex: RegExp; label: string }> = {
    US: { regex: /^1?\d{10}$/, label: "US" },
    UK: { regex: /^(44)?\d{10,11}$/, label: "UK" },
    IN: { regex: /^(91)?\d{10}$/, label: "India" },
  };

  if (options.country) {
    const pattern = patterns[options.country];
    if (!pattern.regex.test(digits)) {
      errors.push(`Invalid ${pattern.label} phone number`);
    }
  } else if (digits.length < 7 || digits.length > 15) {
    errors.push("Phone number must be between 7 and 15 digits");
  }

  return { valid: errors.length === 0, errors };
}
