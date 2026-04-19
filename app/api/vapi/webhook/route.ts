import { NextResponse } from "next/server";
import { processVapiWebhookPayload } from "@/lib/vapi-webhook-service";

/**
 * **POST**: Vapi lifecycle webhook (call start/end, transcript updates, etc.). Always returns **200** so Vapi does not retry storms.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  await processVapiWebhookPayload(body);
  return NextResponse.json({ received: true });
}
