import type { SupabaseClient } from "@supabase/supabase-js";

/** IST calendar day as `YYYY-MM-DD` and inclusive UTC-ish bounds for Supabase filters. */
export function istDayBounds(): { start: string; end: string; ymd: string } {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return {
    ymd,
    start: `${ymd}T00:00:00+05:30`,
    end: `${ymd}T23:59:59.999+05:30`,
  };
}

function thirtyDaysAgoIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString();
}

export type DashboardKpis = {
  leadsToday: number;
  callsCompletedToday: number;
  consultationsBookedToday: number;
  avgRespectScore30d: number | null;
};

/**
 * Loads aggregate KPIs for the clinic owner dashboard (IST “today” + 30-day respect average).
 */
export async function fetchDashboardKpis(
  client: SupabaseClient,
): Promise<DashboardKpis> {
  const { start, end } = istDayBounds();
  const since30 = thirtyDaysAgoIso();

  const [leadsTodayRes, callsTodayRes, bookingsTodayRes, respectRes] =
    await Promise.all([
      client
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
      client
        .from("calls")
        .select("*", { count: "exact", head: true })
        .not("ended_at", "is", null)
        .gte("ended_at", start)
        .lte("ended_at", end),
      client
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
      client
        .from("calls")
        .select("respect_score")
        .gte("created_at", since30)
        .not("respect_score", "is", null),
    ]);

  if (leadsTodayRes.error) {
    console.error("fetchDashboardKpis leads:", leadsTodayRes.error);
  }
  if (callsTodayRes.error) {
    console.error("fetchDashboardKpis calls:", callsTodayRes.error);
  }
  if (bookingsTodayRes.error) {
    console.error("fetchDashboardKpis bookings:", bookingsTodayRes.error);
  }
  if (respectRes.error) {
    console.error("fetchDashboardKpis respect:", respectRes.error);
  }

  const scores =
    respectRes.data
      ?.map((r) => r.respect_score)
      .filter((n): n is number => typeof n === "number" && !Number.isNaN(n)) ??
    [];

  const avgRespectScore30d =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
        10
      : null;

  return {
    leadsToday: leadsTodayRes.count ?? 0,
    callsCompletedToday: callsTodayRes.count ?? 0,
    consultationsBookedToday: bookingsTodayRes.count ?? 0,
    avgRespectScore30d,
  };
}

export type LeadTableRow = {
  leadId: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
  latestCallId: string | null;
  latestRespectScore: number | null;
};

type EmbeddedCall = {
  id: string;
  respect_score: number | null;
  ended_at: string | null;
  created_at: string | null;
};

function pickLatestCall(
  calls: EmbeddedCall[] | null | undefined,
): { id: string; respect_score: number | null } | null {
  if (!calls?.length) {
    return null;
  }
  const sorted = [...calls].sort((a, b) => {
    const ta = Date.parse(a.ended_at ?? a.created_at ?? "");
    const tb = Date.parse(b.ended_at ?? b.created_at ?? "");
    return tb - ta;
  });
  const top = sorted[0];
  if (!top?.id) {
    return null;
  }
  return { id: top.id, respect_score: top.respect_score };
}

/**
 * Loads recent leads with their latest call id and respect score for the dashboard table.
 */
export async function fetchLeadsForDashboard(
  client: SupabaseClient,
  limit = 60,
): Promise<LeadTableRow[]> {
  const { data, error } = await client
    .from("leads")
    .select(
      "id, name, phone, status, created_at, calls(id, respect_score, ended_at, created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchLeadsForDashboard:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const latest = pickLatestCall(row.calls as EmbeddedCall[] | null);
    return {
      leadId: row.id as string,
      name: String(row.name ?? ""),
      phone: String(row.phone ?? ""),
      status: String(row.status ?? ""),
      createdAt: String(row.created_at ?? ""),
      latestCallId: latest?.id ?? null,
      latestRespectScore:
        typeof latest?.respect_score === "number"
          ? latest.respect_score
          : null,
    };
  });
}

export type CallDetailRecord = {
  call: {
    id: string;
    lead_id: string;
    vapi_call_id: string | null;
    started_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    outcome: string | null;
    transcript: unknown;
    summary: string | null;
    respect_score: number | null;
    language_used: string | null;
    created_at: string;
  };
  lead: {
    id: string;
    name: string;
    phone: string;
    status: string;
    language_preference: string | null;
  } | null;
};

/**
 * Loads a single call with its parent lead for the call detail view.
 */
export async function fetchCallDetail(
  client: SupabaseClient,
  callId: string,
): Promise<CallDetailRecord | null> {
  const { data, error } = await client
    .from("calls")
    .select(
      "id, lead_id, vapi_call_id, started_at, ended_at, duration_seconds, outcome, transcript, summary, respect_score, language_used, created_at, leads(id, name, phone, status, language_preference)",
    )
    .eq("id", callId)
    .maybeSingle();

  if (error) {
    console.error("fetchCallDetail:", error);
    return null;
  }
  if (!data) {
    return null;
  }

  type LeadEmbed = {
    id: string;
    name: string;
    phone: string;
    status: string;
    language_preference: string | null;
  };

  const embedded = data.leads as LeadEmbed | LeadEmbed[] | null | undefined;
  const leadRaw = Array.isArray(embedded)
    ? embedded[0]
    : embedded ?? undefined;

  return {
    call: {
      id: data.id as string,
      lead_id: data.lead_id as string,
      vapi_call_id: (data.vapi_call_id as string | null) ?? null,
      started_at: (data.started_at as string | null) ?? null,
      ended_at: (data.ended_at as string | null) ?? null,
      duration_seconds:
        typeof data.duration_seconds === "number"
          ? data.duration_seconds
          : null,
      outcome: (data.outcome as string | null) ?? null,
      transcript: data.transcript,
      summary: (data.summary as string | null) ?? null,
      respect_score:
        typeof data.respect_score === "number" ? data.respect_score : null,
      language_used: (data.language_used as string | null) ?? null,
      created_at: String(data.created_at ?? ""),
    },
    lead: leadRaw
      ? {
          id: leadRaw.id,
          name: leadRaw.name,
          phone: leadRaw.phone,
          status: leadRaw.status,
          language_preference: leadRaw.language_preference,
        }
      : null,
  };
}
