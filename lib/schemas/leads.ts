import { z } from "zod";

export const languagePreferenceSchema = z.enum([
  "en-IN",
  "hi-IN",
  "ml-IN",
  "ta-IN",
  "te-IN",
  "kn-IN",
]);

export const createLeadBodySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().email().optional(),
  ),
  concern: z.string().optional(),
  language_preference: languagePreferenceSchema,
  source: z.string().optional().default("demo"),
});

export type CreateLeadBody = z.infer<typeof createLeadBodySchema>;
