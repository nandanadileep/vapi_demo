import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { assemblePrompt } from "@/lib/prompts";

const VAPI_CALL_URL = "https://api.vapi.ai/call";

/**
 * Normalizes a phone number to **E.164** for Vapi (`customer.number`).
 * If the input already starts with `+`, it is parsed and validated as-is; otherwise India (`IN`) is assumed.
 *
 * @throws Error if the number cannot be parsed or is not a valid phone number.
 */
export function formatPhoneForVapi(phone: string): string {
  const trimmed = phone.trim();
  try {
    if (trimmed.startsWith("+")) {
      const parsed = parsePhoneNumberFromString(trimmed);
      if (!parsed?.isValid()) {
        throw new Error("Invalid E.164 phone number");
      }
      return parsed.format("E.164");
    }
    const parsed = parsePhoneNumberFromString(trimmed, "IN");
    if (!parsed?.isValid()) {
      throw new Error("Invalid phone number for region IN");
    }
    return parsed.format("E.164");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`formatPhoneForVapi: ${message}`);
  }
}

/**
 * Starts an outbound phone call via Vapi with the agent’s assistant configuration (Anthropic, Sarvam TTS bridge, Deepgram, tool definitions).
 *
 * @throws Error on missing env vars, invalid phone, network failure, non-OK HTTP status, or a Vapi response without an `id`.
 */
export async function triggerVapiCall(params: {
  leadId: string;
  name: string;
  phone: string;
  concern: string | null;
  languagePreference: string;
  clinicName: string;
  clinicCity: string;
}): Promise<{ callId: string }> {
  const apiKey = process.env.VAPI_API_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const clinicPhone = process.env.CLINIC_PHONE;

  if (!apiKey) {
    throw new Error("Missing VAPI_API_KEY");
  }
  if (!phoneNumberId) {
    throw new Error("Missing VAPI_PHONE_NUMBER_ID");
  }
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_BASE_URL");
  }
  if (!clinicPhone) {
    throw new Error("Missing CLINIC_PHONE (required to assemble assistant prompt)");
  }

  let e164: string;
  try {
    e164 = formatPhoneForVapi(params.phone);
  } catch (err) {
    console.error("triggerVapiCall: invalid phone", err);
    throw err;
  }

  const systemPrompt = assemblePrompt({
    name: params.name,
    concern: params.concern,
    languagePreference: params.languagePreference,
    clinicName: params.clinicName,
    clinicCity: params.clinicCity,
    clinicPhone,
  });

  const body = {
    type: "outboundPhoneCall",
    phoneNumberId,
    customer: { number: e164 },
    assistant: {
      model: {
        provider: "anthropic",
        model: "claude-sonnet-4-5",
        messages: [{ role: "system", content: systemPrompt }],
      },
      voice: {
        provider: "custom-voice",
        server: {
          url: `${baseUrl}/api/sarvam/tts`,
        },
      },
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "multi",
      },
      serverUrl: `${baseUrl}/api/vapi/webhook`,
      clientMessages: [],
      serverMessages: ["end-of-call-report", "function-call", "transcript"],
      endCallFunctionEnabled: true,
      functions: [
        {
          name: "check_availability",
          description: "Check available dermatology consultation slots",
          parameters: {
            type: "object",
            properties: {
              preferred_date: {
                type: "string",
                description: "Preferred date in YYYY-MM-DD format",
              },
            },
          },
        },
        {
          name: "book_consultation",
          description: "Book a dermatology consultation slot for the patient",
          parameters: {
            type: "object",
            required: ["slot_start", "concern_summary"],
            properties: {
              slot_start: {
                type: "string",
                description: "ISO datetime of the slot",
              },
              concern_summary: {
                type: "string",
                description:
                  "Brief summary of what they want help with (e.g. acne, hair fall, pigmentation, scar, aesthetic interest) in 1-2 sentences",
              },
            },
          },
        },
        {
          name: "send_whatsapp_info",
          description: "Send clinic information via WhatsApp",
          parameters: {
            type: "object",
            required: ["info_type", "no_followup"],
            properties: {
              info_type: {
                type: "string",
                enum: [
                  "general",
                  "skin",
                  "hair",
                  "aesthetic",
                  "costs",
                  "doctors",
                ],
              },
              no_followup: {
                type: "boolean",
                description:
                  "True if patient explicitly asked for no follow-up calls",
              },
            },
          },
        },
        {
          name: "schedule_callback",
          description: "Schedule a callback at patient's preferred time",
          parameters: {
            type: "object",
            required: ["preferred_time"],
            properties: {
              preferred_time: {
                type: "string",
                description:
                  "Patient's preferred callback time in natural language",
              },
            },
          },
        },
      ],
    },
    metadata: {
      leadId: params.leadId,
      languagePreference: params.languagePreference,
    },
  };

  try {
    const res = await fetch(VAPI_CALL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    if (!res.ok) {
      console.error("Vapi call failed:", res.status, raw);
      throw new Error(
        `Vapi POST /call failed (${res.status}): ${raw || res.statusText}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      console.error("Vapi returned non-JSON body:", raw);
      throw new Error("Vapi returned a non-JSON response body");
    }

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      typeof (parsed as { id: unknown }).id === "string"
    ) {
      return { callId: (parsed as { id: string }).id };
    }

    console.error("Vapi response missing string id:", raw);
    throw new Error(`Vapi response did not include a string id: ${raw}`);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Vapi")) {
      throw err;
    }
    console.error("triggerVapiCall: request error", err);
    throw new Error(
      `triggerVapiCall: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
