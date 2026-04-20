import Anthropic from "@anthropic-ai/sdk";
import { getAgentDisplayNameSentenceCase } from "@/lib/agent-name";
import { getLanguageFromDetected } from "@/lib/sarvam";
import type { Call } from "@/lib/supabase";

export type CallOutcome = NonNullable<Call["outcome"]>;

function transcriptToJson(transcript: unknown): string {
  try {
    return JSON.stringify(transcript ?? []);
  } catch {
    return "[]";
  }
}

function isTextBlock(block: unknown): block is { type: "text"; text: string } {
  return (
    typeof block === "object" &&
    block !== null &&
    (block as { type?: unknown }).type === "text" &&
    typeof (block as { text?: unknown }).text === "string"
  );
}

function extractTextFromMessage(message: Anthropic.Messages.Message): string {
  const { content } = message;
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((block) => (isTextBlock(block) ? block.text : ""))
    .join("\n")
    .trim();
}

/**
 * Runs two Anthropic analyses (summary + autonomy score) in parallel on the call transcript.
 * On failure, returns safe fallbacks so webhook processing can continue.
 */
export async function analyzeTranscriptWithClaude(transcript: unknown): Promise<{
  summary: string | null;
  respectScore: number | null;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("analyzeTranscriptWithClaude: missing ANTHROPIC_API_KEY");
    return { summary: null, respectScore: null };
  }

  const client = new Anthropic({ apiKey });
  const payload = transcriptToJson(transcript);
  const coordinator = getAgentDisplayNameSentenceCase();

  const summarySystem = `You are analyzing a call between ${coordinator} (the clinic's voice coordinator) and someone who reached out to a dermatology / skin and hair clinic. Summarize in 2-3 sentences: what they wanted help with, what happened on the call, and what the outcome was. Be factual and compassionate. No jargon.`;

  const scoreSystem = `Rate this call 1-5 on whether ${coordinator} respected the caller's autonomy and emotional state.\n5 = Excellent: ${coordinator} followed the caller's lead, honored silences, offered multiple paths, no pressure.\n4 = Good: mostly respectful, minor pacing issues.\n3 = Adequate: did the job but missed emotional cues.\n2 = Concerning: pushed toward booking despite hesitation.\n1 = Bad: manipulated, used urgency tactics, ignored distress.\nReturn ONLY the number, nothing else.`;

  const model = "claude-sonnet-4-5-20250929";

  try {
    const [summaryMsg, scoreMsg] = await Promise.all([
      client.messages.create({
        model,
        max_tokens: 200,
        system: summarySystem,
        messages: [{ role: "user", content: payload }],
      }),
      client.messages.create({
        model,
        max_tokens: 5,
        system: scoreSystem,
        messages: [{ role: "user", content: payload }],
      }),
    ]);

    const summaryText = extractTextFromMessage(summaryMsg);
    const scoreText = extractTextFromMessage(scoreMsg);
    const parsedScore = Number.parseInt(scoreText.trim().match(/^[\s]*([1-5])/)?.[1] ?? "", 10);
    const respectScore = Number.isFinite(parsedScore) ? parsedScore : null;

    return {
      summary: summaryText || null,
      respectScore,
    };
  } catch (err) {
    console.error("analyzeTranscriptWithClaude: Claude request failed", err);
    return { summary: null, respectScore: null };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function normalizeTranscriptEntries(transcript: unknown): unknown[] {
  if (!Array.isArray(transcript)) {
    return [];
  }
  return transcript;
}

/**
 * Heuristic outcome from transcript tool traces and call duration (Claude summary is separate).
 */
export function inferOutcomeFromTranscript(
  transcript: unknown,
  durationSeconds: number,
): CallOutcome {
  const blob = JSON.stringify(normalizeTranscriptEntries(transcript)).toLowerCase();

  if (blob.includes("book_consultation")) {
    return "booked";
  }
  if (blob.includes("send_whatsapp_info")) {
    return "whatsapp_only";
  }
  if (blob.includes("schedule_callback")) {
    return "callback_requested";
  }
  if (durationSeconds > 0 && durationSeconds < 30) {
    return "no_answer";
  }

  return "not_ready";
}

/**
 * Picks a BCP-47 language tag for storage: first assistant turn language hint, else `getLanguageFromDetected`, else lead default.
 */
export function resolveLanguageUsed(
  transcript: unknown,
  leadLanguagePreference: string,
): string {
  const entries = normalizeTranscriptEntries(transcript);
  for (const entry of entries) {
    const row = asRecord(entry);
    if (!row) {
      continue;
    }
    const role = String(row.role ?? "").toLowerCase();
    if (role !== "assistant" && role !== "bot") {
      continue;
    }
    const lang =
      (typeof row.language === "string" && row.language) ||
      (typeof row.languageCode === "string" && row.languageCode) ||
      (typeof row.lang === "string" && row.lang);
    if (lang) {
      return getLanguageFromDetected(lang);
    }
    break;
  }
  return leadLanguagePreference.trim() || "hi-IN";
}
