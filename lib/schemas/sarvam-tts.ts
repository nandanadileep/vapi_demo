import { z } from "zod";

export const sarvamTtsBodySchema = z.object({
  text: z.string().min(1),
  language: z.string().optional(),
  speaker: z.string().trim().min(1).optional(),
  pace: z.coerce.number().positive().optional(),
});

export type SarvamTtsBody = z.infer<typeof sarvamTtsBodySchema>;
