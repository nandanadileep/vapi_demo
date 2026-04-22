import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_CLINIC_ID } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase";

const webCallEventSchema = z.object({
  event: z.enum(["start", "transcript", "end"]),
  leadId: z.string().uuid(),
  vapiCallId: z.string().min(1),
  transcript: z.array(z.any()).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  languageUsed: z.string().optional(),
});

/**
 * Persists web-call lifecycle events so dashboard can show transcript details.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = webCallEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;
  const db = getSupabaseAdmin();

  if (data.event === "start") {
    const { error } = await db.from("calls").upsert(
      {
        lead_id: data.leadId,
        vapi_call_id: data.vapiCallId,
        started_at: data.startedAt ?? new Date().toISOString(),
        clinic_id: DEFAULT_CLINIC_ID,
      },
      { onConflict: "vapi_call_id" },
    );
    if (error) {
      console.error("web-call start upsert failed:", error);
      return NextResponse.json({ ok: false, error: "Failed to persist call start" }, { status: 500 });
    }

    await db.from("leads").update({ status: "calling" }).eq("id", data.leadId);
    return NextResponse.json({ ok: true });
  }

  if (data.event === "transcript") {
    const { error } = await db
      .from("calls")
      .update({ transcript: data.transcript ?? [] })
      .eq("vapi_call_id", data.vapiCallId);
    if (error) {
      console.error("web-call transcript update failed:", error);
      return NextResponse.json({ ok: false, error: "Failed to persist transcript" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const { error } = await db
    .from("calls")
    .update({
      ended_at: data.endedAt ?? new Date().toISOString(),
      duration_seconds: data.durationSeconds ?? null,
      transcript: data.transcript ?? [],
      language_used: data.languageUsed ?? null,
    })
    .eq("vapi_call_id", data.vapiCallId);
  if (error) {
    console.error("web-call end update failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to persist call end" }, { status: 500 });
  }

  await db.from("leads").update({ status: "completed" }).eq("id", data.leadId);
  return NextResponse.json({ ok: true });
}
