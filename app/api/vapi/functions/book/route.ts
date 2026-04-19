import { NextResponse } from "next/server";
import { bookFunctionBodySchema } from "@/lib/schemas/vapi-functions";
import { runBookConsultation } from "@/lib/vapi-function-services";

/**
 * **POST** — Vapi `book_consultation` tool handler. Persists booking, creates Google Calendar event, sends WhatsApp confirmation.
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

  const parsed = bookFunctionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: "Invalid payload" }),
    });
  }

  if (parsed.data.message.functionCall.name !== "book_consultation") {
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: "Unexpected function" }),
    });
  }

  const leadId = parsed.data.message.call.metadata.leadId;
  const { slot_start, concern_summary } =
    parsed.data.message.functionCall.parameters;

  try {
    const outcome = await runBookConsultation({
      leadId,
      slotStart: slot_start,
      concernSummary: concern_summary,
    });
    return NextResponse.json({ result: JSON.stringify(outcome) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed";
    return NextResponse.json({
      result: JSON.stringify({ success: false, error: message }),
    });
  }
}
