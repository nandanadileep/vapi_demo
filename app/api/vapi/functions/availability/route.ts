import { NextResponse } from "next/server";
import { availabilityFunctionBodySchema } from "@/lib/schemas/vapi-functions";
import { runCheckAvailability } from "@/lib/vapi-function-services";

/**
 * **POST**: Vapi `check_availability` tool handler. Returns `{ result: stringified JSON }` for the assistant.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({
      result: JSON.stringify({
        error: "Invalid JSON body",
        slots: [],
      }),
    });
  }

  const parsed = availabilityFunctionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({
      result: JSON.stringify({
        error: "Invalid payload",
        slots: [],
      }),
    });
  }

  const { functionCall } = parsed.data.message;
  if (functionCall.name !== "check_availability") {
    return NextResponse.json({
      result: JSON.stringify({
        error: "Unexpected function",
        slots: [],
      }),
    });
  }

  const preferred = functionCall.parameters.preferred_date as
    | string
    | undefined;

  const payload = await runCheckAvailability(preferred);
  if (payload.error) {
    return NextResponse.json({
      result: JSON.stringify({
        error: payload.error,
        slots: [],
      }),
    });
  }

  return NextResponse.json({
    result: JSON.stringify({
      slots: payload.slots,
      message: payload.message,
    }),
  });
}
