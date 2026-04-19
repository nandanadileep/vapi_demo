import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/sarvam";
import { sarvamTtsBodySchema } from "@/lib/schemas/sarvam-tts";

/**
 * **POST** — Vapi custom TTS bridge. Accepts `{ text, language? }` and returns `audio/wav` bytes from Sarvam.
 * (HMAC verification deferred for demo.)
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sarvamTtsBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const buffer = await synthesizeSpeech({
      text: parsed.data.text,
      language: parsed.data.language,
    });
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
