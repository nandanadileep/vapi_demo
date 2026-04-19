import twilio from "twilio";
import { formatPhoneForVapi } from "@/lib/vapi";

type MessagingMode = "whatsapp" | "sms";

function getMessagingMode(): MessagingMode {
  const raw = process.env.TWILIO_MESSAGING_MODE?.trim().toLowerCase();
  return raw === "sms" ? "sms" : "whatsapp";
}

function toWhatsAppAddress(to: string): string {
  const trimmed = to.trim();
  if (trimmed.toLowerCase().startsWith("whatsapp:")) {
    return trimmed;
  }
  return `whatsapp:${formatPhoneForVapi(trimmed)}`;
}

function toSmsAddress(to: string): string {
  const trimmed = to.trim();
  if (trimmed.startsWith("+")) {
    return formatPhoneForVapi(trimmed);
  }
  return formatPhoneForVapi(trimmed);
}

function formatSlotForMessage(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function buildMessageBody(
  messageType: "booking_confirmation" | "clinic_info" | "callback_scheduled",
  data: {
    patientName: string;
    clinicName: string;
    clinicPhone: string;
    slotStart?: string;
    infoType?: string;
    callbackTime?: string;
  },
): string {
  if (messageType === "booking_confirmation") {
    if (!data.slotStart) {
      throw new Error(
        "sendPatientMessage: slotStart is required for booking_confirmation",
      );
    }
    const when = formatSlotForMessage(data.slotStart);
    return `Hi ${data.patientName}, your consultation at ${data.clinicName} is confirmed for ${when}. 
We look forward to meeting you. If you need to reschedule, call us at ${data.clinicPhone}. 
Take care 🌿`;
  }

  if (messageType === "clinic_info") {
    const city = process.env.CLINIC_CITY?.trim() || "your area";
    return `Hi ${data.patientName}, here's the information you asked for from ${data.clinicName}:
📍 Located in ${city}
🌿 Dermatology, skin, and hair care
👨‍⚕️ Consultant dermatologists (and hair specialists if offered at the clinic)
📞 Reach us anytime: ${data.clinicPhone}
No pressure - reach out when you're ready.`;
  }

  if (!data.callbackTime) {
    throw new Error(
      "sendPatientMessage: callbackTime is required for callback_scheduled",
    );
  }
  return `Hi ${data.patientName}, we've noted your preferred callback time: ${data.callbackTime}.
The agent will call you then from ${data.clinicName}.
If plans change, reach us at ${data.clinicPhone}. 🌿`;
}

/**
 * Sends a **WhatsApp** or **SMS** patient message via Twilio, depending on `TWILIO_MESSAGING_MODE`.
 *
 * - **whatsapp** (default): `TWILIO_WHATSAPP_FROM` like `whatsapp:+1…`, destination `whatsapp:+…`
 * - **sms** (trial-friendly): `TWILIO_SMS_FROM` = your Twilio **trial phone number** in E.164; destination is plain E.164.  
 *   Trial accounts can only SMS **verified** destination numbers (add them under Twilio Console → Verified Caller IDs).
 *
 * @throws Error when Twilio env vars are missing, required `data` fields for the chosen `messageType` are absent, phone formatting fails, or the Twilio API returns an error.
 */
export async function sendWhatsApp(params: {
  to: string;
  messageType: "booking_confirmation" | "clinic_info" | "callback_scheduled";
  data: {
    patientName: string;
    clinicName: string;
    clinicPhone: string;
    slotStart?: string;
    infoType?: string;
    callbackTime?: string;
  };
}): Promise<{ messageSid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const mode = getMessagingMode();

  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;
  const fromSms = process.env.TWILIO_SMS_FROM;

  if (!accountSid) {
    throw new Error("Missing TWILIO_ACCOUNT_SID");
  }
  if (!authToken) {
    throw new Error("Missing TWILIO_AUTH_TOKEN");
  }

  let from: string;
  if (mode === "sms") {
    if (!fromSms?.trim()) {
      throw new Error(
        "TWILIO_MESSAGING_MODE=sms requires TWILIO_SMS_FROM (your Twilio number in E.164, e.g. +15551234567)",
      );
    }
    from = fromSms.trim();
  } else {
    if (!fromWhatsApp?.trim()) {
      throw new Error(
        "TWILIO_MESSAGING_MODE=whatsapp (default) requires TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886)",
      );
    }
    from = fromWhatsApp.trim();
  }

  let body: string;
  try {
    body = buildMessageBody(params.messageType, params.data);
  } catch (err) {
    console.error("sendWhatsApp: invalid message payload", err);
    throw err;
  }

  let toAddr: string;
  try {
    toAddr = mode === "sms" ? toSmsAddress(params.to) : toWhatsAppAddress(params.to);
  } catch (err) {
    console.error("sendWhatsApp: invalid destination phone", err);
    throw err;
  }

  try {
    const client = twilio(accountSid, authToken);
    const msg = await client.messages.create({
      from,
      to: toAddr,
      body,
    });
    if (!msg.sid) {
      console.error("Twilio returned message without sid:", msg);
      throw new Error("Twilio did not return a message SID");
    }
    return { messageSid: msg.sid };
  } catch (err) {
    console.error("sendWhatsApp: Twilio API error", err);
    throw new Error(
      `sendWhatsApp: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
