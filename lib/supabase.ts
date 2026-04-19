import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Row shape for `leads` (application-level typing; keep aligned with Supabase schema).
 */
export type Lead = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  concern: string | null;
  language_preference: string;
  detected_language: string | null;
  no_followup: boolean;
  status:
    | "new"
    | "calling"
    | "completed"
    | "no_answer"
    | "declined"
    | "not_ready";
  clinic_id: string;
};

/**
 * Row shape for `calls`.
 */
export type Call = {
  id: string;
  lead_id: string;
  clinic_id: string;
  vapi_call_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  outcome:
    | "booked"
    | "whatsapp_only"
    | "callback_requested"
    | "not_ready"
    | "no_answer"
    | "declined"
    | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vapi transcript payload (schema-agnostic)
  transcript: any | null;
  summary: string | null;
  respect_score: number | null;
  language_used: string | null;
  created_at: string;
};

/**
 * Row shape for `bookings`.
 */
export type Booking = {
  id: string;
  lead_id: string;
  clinic_id: string;
  call_id: string | null;
  slot_start: string;
  slot_end: string;
  google_event_id: string | null;
  whatsapp_sent: boolean;
  created_at: string;
};

/**
 * Row shape for `followup_suppressions`.
 */
export type FollowupSuppression = {
  lead_id: string;
  reason: string | null;
  created_at: string;
};

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const url = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);
const anonKey = requireEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const serviceRoleKey = requireEnv(
  "SUPABASE_SERVICE_ROLE_KEY",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * Supabase client for **browser / client components** using the public anon key.
 * Do not use for privileged operations — use {@link supabaseAdmin} on the server instead.
 */
export const supabase: SupabaseClient = createClient(url, anonKey);

/**
 * Supabase client for **server-only** code paths (API routes, server actions) using the service role key.
 * Never expose this client or its key to the browser.
 */
export const supabaseAdmin: SupabaseClient = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
