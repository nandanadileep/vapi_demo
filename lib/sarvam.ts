/**
 * Maps Vapi / Deepgram short language tags to Sarvam **BCP-47** `target_language_code` values.
 */
export function getLanguageFromDetected(
  vapiTranscriptLanguage: string,
): string {
  const base = vapiTranscriptLanguage.trim().toLowerCase().split("-")[0] ?? "";
  const map: Record<string, string> = {
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    en: "en-IN",
    bn: "bn-IN",
    mr: "mr-IN",
  };
  return map[base] ?? "hi-IN";
}

const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";
const DEFAULT_SARVAM_SPEAKER = "priya";
const DEFAULT_SARVAM_PACE = 1.0;

type SarvamTtsResponse = {
  audios?: string[];
};

function getDefaultSarvamSpeaker(): string {
  return process.env.SARVAM_SPEAKER?.trim() || DEFAULT_SARVAM_SPEAKER;
}

function getDefaultSarvamPace(): number {
  const raw = process.env.SARVAM_PACE?.trim();
  if (!raw) {
    return DEFAULT_SARVAM_PACE;
  }
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SARVAM_PACE;
  }
  return parsed;
}

/**
 * Calls Sarvam’s **Bulbul v3** TTS API and returns decoded **WAV** audio as a binary buffer.
 *
 * @throws Error when `SARVAM_API_KEY` is missing, the HTTP request fails, the response is invalid, or base64 decoding fails.
 */
export async function synthesizeSpeech(params: {
  text: string;
  language: string;
  speaker?: string;
  pace?: number;
}): Promise<Buffer> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SARVAM_API_KEY");
  }

  const body = {
    inputs: [params.text],
    target_language_code: params.language,
    // Sarvam Bulbul v3 voice id (API slug), not the assistant display name.
    speaker: params.speaker?.trim() || getDefaultSarvamSpeaker(),
    pace: params.pace ?? getDefaultSarvamPace(),
    model: "bulbul:v3",
    enable_preprocessing: true,
  };

  try {
    const res = await fetch(SARVAM_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    if (!res.ok) {
      console.error("Sarvam TTS HTTP error:", res.status, raw);
      throw new Error(
        `Sarvam TTS failed (${res.status}): ${raw || res.statusText}`,
      );
    }

    let parsed: SarvamTtsResponse;
    try {
      parsed = JSON.parse(raw) as SarvamTtsResponse;
    } catch {
      console.error("Sarvam TTS returned non-JSON:", raw);
      throw new Error("Sarvam TTS returned a non-JSON response");
    }

    const b64 = parsed.audios?.[0];
    if (!b64 || typeof b64 !== "string") {
      console.error("Sarvam TTS missing audios[0]:", raw);
      throw new Error("Sarvam TTS response missing audios[0]");
    }

    try {
      return Buffer.from(b64, "base64");
    } catch (err) {
      console.error("Sarvam TTS base64 decode failed:", err);
      throw new Error("Failed to decode Sarvam audio base64 payload");
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Sarvam")) {
      throw err;
    }
    if (err instanceof Error && err.message.startsWith("Failed to decode")) {
      throw err;
    }
    console.error("synthesizeSpeech: unexpected error", err);
    throw new Error(
      `synthesizeSpeech: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
