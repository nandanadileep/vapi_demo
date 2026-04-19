import { NextResponse } from "next/server";
import { callbackFunctionBodySchema } from "@/lib/schemas/vapi-functions";
import { runScheduleCallback } from "@/lib/vapi-function-services";

/**
 * **POST** — Vapi `schedule_callback` tool handler. Respects `followup_suppressions` before sending a WhatsApp callback notice.
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

  const parsed = callbackFunctionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: "Invalid payload" }),
    });
  }

  if (parsed.data.message.functionCall.name !== "schedule_callback") {
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: "Unexpected function" }),
    });
  }

  const leadId = parsed.data.message.call.metadata.leadId;
  const { preferred_time } = parsed.data.message.functionCall.parameters;

  try {
    const out = await runScheduleCallback({
      leadId,
      preferredTime: preferred_time,
    });
    return NextResponse.json({ result: JSON.stringify(out) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Callback scheduling failed";
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: message }),
    });
  }
}
