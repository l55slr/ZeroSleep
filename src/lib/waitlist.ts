import { z } from "zod";

export const waitlistEmailSchema = z
  .string()
  .trim()
  .max(254)
  .toLowerCase()
  .pipe(z.email());

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message: string;
  field?: "email";
};
