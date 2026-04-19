import { addMinutes } from "date-fns";
import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_CLINIC_ID } from "@/lib/constants";
import { getAvailableSlots, createCalendarEvent } from "@/lib/google-calendar";
import { sendWhatsApp } from "@/lib/twilio";

/**
 * Fetches calendar availability for Vapi’s `check_availability` tool.
 */
export async function runCheckAvailability(
  preferredDate?: string,
): Promise<{ slots: Awaited<ReturnType<typeof getAvailableSlots>>; message: string; error?: string }> {
  try {
    const slots = await getAvailableSlots(preferredDate);
    return {
      slots,
      message: "I found these available slots for you",
    };
  } catch (err) {
    console.error("runCheckAvailability failed:", err);
    return {
      slots: [],
      message: "Could not fetch slots",
      error: "Could not fetch slots",
    };
  }
}

/**
 * Books a consultation slot, writes the `bookings` row, sends WhatsApp confirmation, and marks `whatsapp_sent`.
 */
export async function runBookConsultation(params: {
  leadId: string;
  slotStart: string;
  concernSummary: string;
}): Promise<
  | {
      success: true;
      message: string;
      slot: string;
      confirmationSent: true;
    }
  | { success: false; error: string }
> {
  const clinicName = process.env.CLINIC_NAME ?? "";
  const clinicPhone = process.env.CLINIC_PHONE ?? "";
  if (!clinicName || !clinicPhone) {
    return { success: false, error: "Missing CLINIC_NAME or CLINIC_PHONE" };
  }

  try {
    const { data: lead, error: leadErr } = await getSupabaseAdmin()
      .from("leads")
      .select("id, name, phone")
      .eq("id", params.leadId)
      .maybeSingle();

    if (leadErr || !lead) {
      console.error("runBookConsultation: lead not found", leadErr);
      return { success: false, error: "Lead not found" };
    }

    const slotStartDate = new Date(params.slotStart);
    if (Number.isNaN(slotStartDate.getTime())) {
      return { success: false, error: "Invalid slot_start datetime" };
    }
    const slotEndDate = addMinutes(slotStartDate, 30);

    const { eventId } = await createCalendarEvent({
      patientName: String(lead.name),
      patientPhone: String(lead.phone),
      slotStart: slotStartDate.toISOString(),
      slotEnd: slotEndDate.toISOString(),
      concernSummary: params.concernSummary,
      clinicName,
    });

    const { data: booking, error: bookErr } = await getSupabaseAdmin()
      .from("bookings")
      .insert({
        lead_id: params.leadId,
        call_id: null,
        slot_start: slotStartDate.toISOString(),
        slot_end: slotEndDate.toISOString(),
        google_event_id: eventId,
        clinic_id: DEFAULT_CLINIC_ID,
      })
      .select("id")
      .single();

    if (bookErr || !booking?.id) {
      console.error("runBookConsultation: booking insert failed", bookErr);
      return { success: false, error: "Failed to save booking" };
    }

    try {
      await sendWhatsApp({
        to: String(lead.phone),
        messageType: "booking_confirmation",
        data: {
          patientName: String(lead.name),
          clinicName,
          clinicPhone,
          slotStart: slotStartDate.toISOString(),
        },
      });
    } catch (waErr) {
      console.error("runBookConsultation: WhatsApp failed", waErr);
      return {
        success: false,
        error: waErr instanceof Error ? waErr.message : "WhatsApp send failed",
      };
    }

    const { error: flagErr } = await getSupabaseAdmin()
      .from("bookings")
      .update({ whatsapp_sent: true })
      .eq("id", booking.id as string);

    if (flagErr) {
      console.error("runBookConsultation: failed to flag whatsapp_sent", flagErr);
    }

    return {
      success: true,
      message: "Consultation booked successfully",
      slot: params.slotStart,
      confirmationSent: true,
    };
  } catch (err) {
    console.error("runBookConsultation failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Booking failed",
    };
  }
}

/**
 * Sends clinic info over WhatsApp and, when `no_followup` is true, enforces suppression in `followup_suppressions`.
 */
export async function runSendWhatsappInfo(params: {
  leadId: string;
  noFollowup: boolean;
}): Promise<{ success: true; whatsappSent: true; suppressed: boolean }> {
  const clinicName = process.env.CLINIC_NAME ?? "";
  const clinicPhone = process.env.CLINIC_PHONE ?? "";
  if (!clinicName || !clinicPhone) {
    throw new Error("Missing CLINIC_NAME or CLINIC_PHONE");
  }

  const { data: lead, error: leadErr } = await getSupabaseAdmin()
    .from("leads")
    .select("id, name, phone")
    .eq("id", params.leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    throw new Error("Lead not found");
  }

  await sendWhatsApp({
    to: String(lead.phone),
    messageType: "clinic_info",
    data: {
      patientName: String(lead.name),
      clinicName,
      clinicPhone,
    },
  });

  if (params.noFollowup) {
    // INTEGRITY CHECK: When the voice coordinator promises "no follow-up calls",
    // that promise is enforced at the database level here.
    // Once a lead_id is in followup_suppressions, NO automated
    // callback will ever be scheduled for them. This is not a
    // prompt instruction; it is a database constraint.
    const { error: supErr } = await getSupabaseAdmin()
      .from("followup_suppressions")
      .upsert(
        {
          lead_id: params.leadId,
          reason: "patient_requested_no_followup",
        },
        { onConflict: "lead_id" },
      );

    if (supErr) {
      console.error("runSendWhatsappInfo: suppression insert failed", supErr);
      throw new Error("Failed to record follow-up suppression");
    }

    const { error: leadUpdErr } = await getSupabaseAdmin()
      .from("leads")
      .update({ no_followup: true })
      .eq("id", params.leadId);

    if (leadUpdErr) {
      console.error("runSendWhatsappInfo: failed to update lead.no_followup", leadUpdErr);
      throw new Error("Failed to update lead suppression flag");
    }
  }

  return {
    success: true,
    whatsappSent: true,
    suppressed: params.noFollowup,
  };
}

/**
 * Schedules a callback notification unless the lead is in `followup_suppressions`.
 */
export async function runScheduleCallback(params: {
  leadId: string;
  preferredTime: string;
}): Promise<
  | { success: false; suppressed: true }
  | { success: true; suppressed: false; callbackScheduled: true }
> {
  // SUPPRESSION CHECK: Before scheduling ANY callback,
  // verify this lead has not opted out of follow-up calls.
  // This is the architectural integrity check: a promise made
  // verbally by the coordinator is enforced here in the database.
  // If suppressed, we return suppressed: true and the coordinator must
  // not mention callbacks again. This cannot be overridden by
  // the prompt or by re-calling this function.
  const { data: suppressedRow, error: supErr } = await getSupabaseAdmin()
    .from("followup_suppressions")
    .select("lead_id")
    .eq("lead_id", params.leadId)
    .maybeSingle();

  if (supErr) {
    console.error("runScheduleCallback: suppression lookup failed", supErr);
    throw new Error("Suppression lookup failed");
  }

  if (suppressedRow) {
    console.error(
      `Callback blocked for suppressed lead ${params.leadId}`,
    );
    return { success: false, suppressed: true };
  }

  const clinicName = process.env.CLINIC_NAME ?? "";
  const clinicPhone = process.env.CLINIC_PHONE ?? "";
  if (!clinicName || !clinicPhone) {
    throw new Error("Missing CLINIC_NAME or CLINIC_PHONE");
  }

  const { data: lead, error: leadErr } = await getSupabaseAdmin()
    .from("leads")
    .select("id, name, phone")
    .eq("id", params.leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    throw new Error("Lead not found");
  }

  await sendWhatsApp({
    to: String(lead.phone),
    messageType: "callback_scheduled",
    data: {
      patientName: String(lead.name),
      clinicName,
      clinicPhone,
      callbackTime: params.preferredTime,
    },
  });

  return { success: true, suppressed: false, callbackScheduled: true };
}
