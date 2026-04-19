import { z } from "zod";

export const sarvamTtsBodySchema = z.object({
  text: z.string().min(1),
  language: z.string().optional().default("hi-IN"),
});

export type SarvamTtsBody = z.infer<typeof sarvamTtsBodySchema>;
