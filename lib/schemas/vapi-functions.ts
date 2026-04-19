import { z } from "zod";

/** Vapi POST body for `check_availability` tool execution. */
export const availabilityFunctionBodySchema = z.object({
  message: z.object({
    type: z.string(),
    functionCall: z.object({
      name: z.string(),
      parameters: z
        .object({
          preferred_date: z.string().optional(),
        })
        .passthrough(),
    }),
    call: z.object({
      metadata: z
        .object({
          leadId: z.string().min(1),
        })
        .passthrough(),
    }),
  }),
});

/** Vapi POST body for `book_consultation`. */
export const bookFunctionBodySchema = z.object({
  message: z.object({
    functionCall: z.object({
      name: z.string(),
      parameters: z.object({
        slot_start: z.string().min(1),
        concern_summary: z.string().min(1),
      }),
    }),
    call: z.object({
      metadata: z.object({
        leadId: z.string().min(1),
      }),
    }),
  }),
});

/** Vapi POST body for `send_whatsapp_info`. */
export const whatsappFunctionBodySchema = z.object({
  message: z.object({
    functionCall: z.object({
      name: z.string(),
      parameters: z.object({
        info_type: z.string().min(1),
        no_followup: z.boolean(),
      }),
    }),
    call: z.object({
      metadata: z.object({
        leadId: z.string().min(1),
      }),
    }),
  }),
});

/** Vapi POST body for `schedule_callback`. */
export const callbackFunctionBodySchema = z.object({
  message: z.object({
    functionCall: z.object({
      name: z.string(),
      parameters: z.object({
        preferred_time: z.string().min(1),
      }),
    }),
    call: z.object({
      metadata: z.object({
        leadId: z.string().min(1),
      }),
    }),
  }),
});
