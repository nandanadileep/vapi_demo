import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_CLINIC_ID } from "@/lib/constants";
import { triggerVapiCall } from "@/lib/vapi";
import type { CreateLeadBody } from "@/lib/schemas/leads";

export type LeadIntakeSuccess = {
  kind: "ok";
  leadId: string;
  message: string;
};

export type LeadIntakeVapiFailed = {
  kind: "vapi_failed";
  leadId: string;
  message: string;
};

export type LeadIntakeInsertFailed = {
  kind: "insert_failed";
};

/**
 * Inserts a lead, triggers an outbound Vapi call, and marks the lead as `calling` when the call starts successfully.
 * Insert always happens before the Vapi request; status is only advanced after a successful Vapi trigger.
 */
export async function createLeadAndInitiateCall(
  input: CreateLeadBody,
  phoneE164: string,
): Promise<LeadIntakeSuccess | LeadIntakeVapiFailed | LeadIntakeInsertFailed> {
  const clinicName = process.env.CLINIC_NAME;
  const clinicCity = process.env.CLINIC_CITY;
  if (!clinicName || !clinicCity) {
    console.error("createLeadAndInitiateCall: missing CLINIC_NAME or CLINIC_CITY");
    return { kind: "insert_failed" };
  }

  const email =
    input.email === undefined || input.email === "" ? null : input.email;

  const { data: lead, error: insertError } = await getSupabaseAdmin()
    .from("leads")
    .insert({
      name: input.name,
      phone: phoneE164,
      email,
      concern: input.concern ?? null,
      language_preference: input.language_preference,
      source: input.source ?? "demo",
      status: "new",
      clinic_id: DEFAULT_CLINIC_ID,
    })
    .select("id")
    .single();

  if (insertError || !lead?.id) {
    console.error("createLeadAndInitiateCall: insert failed", insertError);
    return { kind: "insert_failed" };
  }

  const leadId = lead.id as string;

  try {
    await triggerVapiCall({
      leadId,
      name: input.name,
      phone: phoneE164,
      concern: input.concern ?? null,
      languagePreference: input.language_preference,
      clinicName,
      clinicCity,
    });
  } catch (err) {
    console.error("createLeadAndInitiateCall: Vapi trigger failed", err);
    const { error: revertErr } = await getSupabaseAdmin()
      .from("leads")
      .update({ status: "new" })
      .eq("id", leadId);
    if (revertErr) {
      console.error("createLeadAndInitiateCall: failed to revert lead status", revertErr);
    }
    return {
      kind: "vapi_failed",
      leadId,
      message: "Lead saved, call could not be initiated",
    };
  }

  const { error: statusErr } = await getSupabaseAdmin()
    .from("leads")
    .update({ status: "calling" })
    .eq("id", leadId);

  if (statusErr) {
    console.error(
      "createLeadAndInitiateCall: status update failed after successful Vapi trigger",
      statusErr,
    );
  }

  return {
    kind: "ok",
    leadId,
    message: "The agent will call you within 60 seconds",
  };
}
