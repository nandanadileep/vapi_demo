import { NextResponse } from "next/server";
import { whatsappFunctionBodySchema } from "@/lib/schemas/vapi-functions";
import { runSendWhatsappInfo } from "@/lib/vapi-function-services";

/**
 * **POST** — Vapi `send_whatsapp_info` tool handler. Sends WhatsApp and enforces follow-up suppression when requested.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: "Invalid JSON body" }),
    });
  }

  const parsed = whatsappFunctionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: "Invalid payload" }),
    });
  }

  if (parsed.data.message.functionCall.name !== "send_whatsapp_info") {
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: "Unexpected function" }),
    });
  }

  const leadId = parsed.data.message.call.metadata.leadId;
  const { no_followup } = parsed.data.message.functionCall.parameters;

  try {
    const out = await runSendWhatsappInfo({
      leadId,
      noFollowup: no_followup,
    });
    return NextResponse.json({ result: JSON.stringify(out) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "WhatsApp flow failed";
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: message }),
    });
  }
}
