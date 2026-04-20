// TODO: Delete this debug route before production — exposes assembled system prompt.

import { assemblePrompt } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export async function GET() {
  const prompt = assemblePrompt({
    name: "Test Patient",
    concern: "acne scars",
    languagePreference: "hi-IN",
    clinicName: process.env.CLINIC_NAME ?? "Bloomindial Skin Clinic",
    clinicCity: process.env.CLINIC_CITY ?? "Bengaluru",
    clinicPhone: process.env.NEXT_PUBLIC_CLINIC_PHONE ?? "",
  });
  return new Response(prompt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
