import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_CLINIC_ID } from "@/lib/constants";
import {
  analyzeTranscriptWithClaude,
  inferOutcomeFromTranscript,
  resolveLanguageUsed,
} from "@/lib/call-analysis";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(obj: unknown, keys: string[]): string | undefined {
  const r = asRecord(obj);
  if (!r) {
    return undefined;
  }
  for (const key of keys) {
    const v = r[key];
    if (typeof v === "string" && v.length > 0) {
      return v;
    }
  }
  return undefined;
}

/**
 * Normalizes Vapi / transport variants to canonical event names used by Gloomindial.
 */
export function normalizeVapiEventType(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === "call.started" || t === "call-started") {
    return "call.started";
  }
  if (
    t === "call.ended" ||
    t === "call-ended" ||
    t === "end-of-call-report"
  ) {
    return "call.ended";
  }
  if (t === "transcript.updated" || t === "transcript-update") {
    return "transcript.updated";
  }
  return raw.trim();
}

function extractTopMessage(body: unknown): Record<string, unknown> | null {
  const root = asRecord(body);
  if (!root) {
    return null;
  }
  return asRecord(root.message) ?? root;
}

function extractEventType(body: unknown): string {
  const msg = extractTopMessage(body);
  const direct = typeof msg?.type === "string" ? msg.type : undefined;
  if (direct) {
    return direct;
  }
  const root = asRecord(body);
  return typeof root?.type === "string" ? root.type : "";
}

function extractCallSection(message: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!message) {
    return null;
  }
  return asRecord(message.call) ?? null;
}

function extractVapiCallId(body: unknown): string | undefined {
  const msg = extractTopMessage(body);
  const call = extractCallSection(msg);
  return readString(call, ["id"]);
}

function extractLeadIdFromMetadata(body: unknown): string | undefined {
  const msg = extractTopMessage(body);
  const call = extractCallSection(msg);
  const meta = asRecord(call?.metadata);
  return readString(meta, ["leadId", "lead_id"]);
}

function extractArtifact(body: unknown): Record<string, unknown> | null {
  const msg = extractTopMessage(body);
  return asRecord(msg?.artifact);
}

function extractTranscriptFromArtifact(body: unknown): unknown {
  const art = extractArtifact(body);
  if (!art) {
    return [];
  }
  if (Array.isArray(art.transcript)) {
    return art.transcript;
  }
  if (Array.isArray(art.messages)) {
    return art.messages;
  }
  return [];
}

function extractSummaryFromArtifact(body: unknown): string | null {
  const art = extractArtifact(body);
  if (!art) {
    return null;
  }
  const s = art.summary;
  return typeof s === "string" ? s : null;
}

function extractCallTimes(body: unknown): { started?: string; ended?: string } {
  const msg = extractTopMessage(body);
  const call = extractCallSection(msg);
  return {
    started: readString(call, ["startedAt", "started_at", "startTime"]),
    ended: readString(call, ["endedAt", "ended_at", "endTime"]),
  };
}

function durationSecondsFromIso(started?: string, ended?: string): number {
  if (!started || !ended) {
    return 0;
  }
  const a = Date.parse(started);
  const b = Date.parse(ended);
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) {
    return 0;
  }
  return Math.round((b - a) / 1000);
}

async function handleCallStarted(body: unknown): Promise<void> {
  const leadId = extractLeadIdFromMetadata(body);
  const callId = extractVapiCallId(body);
  if (!leadId || !callId) {
    console.error("handleCallStarted: missing leadId or call id", { leadId, callId });
    return;
  }

  const { data: lead, error: leadErr } = await getSupabaseAdmin()
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    console.error("handleCallStarted: lead not found", leadId, leadErr);
    return;
  }

  const { error: upsertErr } = await getSupabaseAdmin().from("calls").upsert(
    {
      lead_id: leadId,
      vapi_call_id: callId,
      started_at: new Date().toISOString(),
      clinic_id: DEFAULT_CLINIC_ID,
    },
    { onConflict: "vapi_call_id" },
  );

  if (upsertErr) {
    console.error("handleCallStarted: upsert call failed", upsertErr);
    return;
  }

  const { error: leadUpdateErr } = await getSupabaseAdmin()
    .from("leads")
    .update({ status: "calling" })
    .eq("id", leadId);

  if (leadUpdateErr) {
    console.error("handleCallStarted: failed to update lead status", leadUpdateErr);
  }
}

function mapLeadStatusForOutcome(outcome: string): "completed" | "no_answer" {
  if (outcome === "no_answer") {
    return "no_answer";
  }
  return "completed";
}

async function handleCallEnded(body: unknown): Promise<void> {
  const vapiCallId = extractVapiCallId(body);
  if (!vapiCallId) {
    console.error("handleCallEnded: missing vapi call id");
    return;
  }

  const transcript = extractTranscriptFromArtifact(body);
  const artifactSummary = extractSummaryFromArtifact(body);
  const { started, ended } = extractCallTimes(body);
  const durationSeconds = durationSecondsFromIso(started, ended);
  const leadId = extractLeadIdFromMetadata(body);

  const { data: callRow, error: callFindErr } = await getSupabaseAdmin()
    .from("calls")
    .select("id, lead_id")
    .eq("vapi_call_id", vapiCallId)
    .maybeSingle();

  if (callFindErr || !callRow) {
    console.error("handleCallEnded: call row not found for", vapiCallId, callFindErr);
    return;
  }

  const resolvedLeadId = (callRow.lead_id as string) ?? leadId;
  if (!resolvedLeadId) {
    console.error("handleCallEnded: missing lead_id on call row");
    return;
  }

  const { data: leadRow, error: leadErr } = await getSupabaseAdmin()
    .from("leads")
    .select("language_preference")
    .eq("id", resolvedLeadId)
    .maybeSingle();

  if (leadErr || !leadRow) {
    console.error("handleCallEnded: lead not found", resolvedLeadId, leadErr);
    return;
  }

  const languagePref = String(leadRow.language_preference ?? "hi-IN");
  const languageUsed = resolveLanguageUsed(transcript, languagePref);

  const claude = await analyzeTranscriptWithClaude(transcript);
  const heuristicOutcome = inferOutcomeFromTranscript(
    transcript,
    durationSeconds,
  );

  const summary = artifactSummary ?? claude.summary;
  const outcome = heuristicOutcome;

  const { error: callUpdateErr } = await getSupabaseAdmin()
    .from("calls")
    .update({
      ended_at: ended ?? new Date().toISOString(),
      duration_seconds: durationSeconds,
      outcome,
      transcript,
      summary,
      respect_score: claude.respectScore,
      language_used: languageUsed,
    })
    .eq("id", callRow.id as string);

  if (callUpdateErr) {
    console.error("handleCallEnded: failed to update call", callUpdateErr);
    return;
  }

  const leadStatus = mapLeadStatusForOutcome(outcome);
  const { error: leadUpdateErr } = await getSupabaseAdmin()
    .from("leads")
    .update({ status: leadStatus })
    .eq("id", resolvedLeadId);

  if (leadUpdateErr) {
    console.error("handleCallEnded: failed to update lead", leadUpdateErr);
  }
}

function extractLiveTranscript(body: unknown): unknown {
  const msg = extractTopMessage(body);
  const fromMessage = msg ? (msg as { transcript?: unknown }).transcript : undefined;
  if (Array.isArray(fromMessage)) {
    return fromMessage;
  }
  return extractTranscriptFromArtifact(body);
}

async function handleTranscriptUpdated(body: unknown): Promise<void> {
  const vapiCallId = extractVapiCallId(body);
  if (!vapiCallId) {
    return;
  }
  const transcript = extractLiveTranscript(body);
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return;
  }
  const { error } = await getSupabaseAdmin()
    .from("calls")
    .update({ transcript })
    .eq("vapi_call_id", vapiCallId);
  if (error) {
    console.error("handleTranscriptUpdated: update failed", error);
  }
}

/**
 * Processes a Vapi webhook payload: persists call lifecycle updates and post-call analytics.
 * Always completes without throwing so the HTTP layer can ACK Vapi with HTTP 200.
 */
export async function processVapiWebhookPayload(body: unknown): Promise<void> {
  const rawType = extractEventType(body);
  const type = normalizeVapiEventType(rawType);

  try {
    if (type === "call.started") {
      await handleCallStarted(body);
      return;
    }
    if (type === "call.ended") {
      try {
        await handleCallEnded(body);
      } catch (err) {
        console.error("call.ended handler failed (swallowed for Vapi ack)", err);
      }
      return;
    }
    if (type === "transcript.updated") {
      await handleTranscriptUpdated(body);
    }
  } catch (err) {
    console.error("processVapiWebhookPayload: unexpected error", err);
  }
}
