import { NextResponse } from "next/server";
import { createLeadBodySchema } from "@/lib/schemas/leads";
import { formatPhoneForVapi } from "@/lib/vapi";
import { createLeadAndInitiateCall } from "@/lib/lead-intake";

/**
 * **POST**: Creates a lead, persists it in Supabase, and triggers the voice coordinator’s outbound Vapi call.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createLeadBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  let phoneE164: string;
  try {
    phoneE164 = formatPhoneForVapi(parsed.data.phone);
  } catch {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const result = await createLeadAndInitiateCall(parsed.data, phoneE164);

  if (result.kind === "insert_failed") {
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 },
    );
  }

  if (result.kind === "vapi_failed") {
    return NextResponse.json(
      {
        leadId: result.leadId,
        vapiError: true,
        message: result.message,
        vapiDetail: result.vapiDetail,
      },
      { status: 202 },
    );
  }

  if (result.kind === "web_test_ready") {
    return NextResponse.json(
      {
        leadId: result.leadId,
        message: result.message,
        callMode: "web",
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    { leadId: result.leadId, message: result.message, callMode: "phone" },
    { status: 200 },
  );
}
