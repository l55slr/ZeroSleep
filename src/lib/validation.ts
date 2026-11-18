import { z } from "zod";

export const RESERVED_HANDLES = new Set([
  "about",
  "admin",
  "api",
  "app",
  "auth",
  "blog",
  "dashboard",
  "docs",
  "help",
  "home",
  "login",
  "logout",
  "privacy",
  "settings",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "sitemap",
  "static",
  "support",
  "terms",
  "user",
  "www",
  "zerosleep",
]);

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (handle) => HANDLE_PATTERN.test(handle),
    "Use 3-30 lowercase letters, numbers, or hyphens; start and end with a letter or number",
  )
  .refine((handle) => !RESERVED_HANDLES.has(handle), "This handle is reserved");

export const httpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a valid http(s) URL");

export const linkTypeSchema = z.enum([
  "github",
  "npm",
  "leetcode",
  "x",
  "linkedin",
  "youtube",
  "website",
  "project",
  "custom",
]);

export const profileInputSchema = z.object({
  handle: handleSchema,
  displayName: z.string().trim().min(1).max(40),
  bio: z.string().trim().max(160).optional(),
});

export const linkInputSchema = z.object({
  type: linkTypeSchema,
  label: z.string().trim().min(1).max(40),
  url: httpUrlSchema,
});
