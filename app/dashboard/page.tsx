import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Sparkles, Users } from "lucide-react";
import { getAgentDisplayNameSentenceCase } from "@/lib/agent-name";
import { DashboardStats } from "@/components/DashboardStats";

/** Read `AGENT_NAME` at request time (not at build) for clinic-specific branding. */
export const dynamic = "force-dynamic";
import { LeadsTable } from "@/components/LeadsTable";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  fetchDashboardKpis,
  fetchLeadsForDashboard,
  istDayBounds,
} from "@/lib/dashboard-metrics";

function formatAvg(v: number | null): string {
  if (v === null || Number.isNaN(v)) {
    return "-";
  }
  return v.toFixed(1);
}

function SectionIntro({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex gap-3 sm:mb-6">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-primary/20 to-teal-primary/5 text-teal-primary ring-1 ring-teal-primary/20">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-soft-text sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  let kpis;
  let leads;
  try {
    const db = getSupabaseAdmin();
    [kpis, leads] = await Promise.all([
      fetchDashboardKpis(db),
      fetchLeadsForDashboard(db),
    ]);
  } catch (err) {
    console.error("DashboardPage load failed:", err);
    const detail =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : null;
    return (
      <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive shadow-sm">
        <p>
          Unable to load dashboard data. Confirm{" "}
          <span className="font-mono">.env.local</span> has valid Supabase URL
          and keys, and that the <span className="font-mono">leads</span>,{" "}
          <span className="font-mono">calls</span>, and{" "}
          <span className="font-mono">bookings</span> tables exist.
        </p>
        {detail ? (
          <p className="rounded-xl border border-destructive/20 bg-white/90 p-3 font-mono text-xs text-soft-text">
            {detail}
          </p>
        ) : null}
      </div>
    );
  }

  const { ymd } = istDayBounds();
  const avg = kpis.avgRespectScore30d;
  const agentLabel = getAgentDisplayNameSentenceCase();

  return (
    <div className="space-y-12 sm:space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-teal-primary/25 bg-gradient-to-br from-white via-white to-teal-primary/[0.06] p-6 shadow-xl shadow-teal-primary/10 ring-1 ring-black/[0.03] sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-primary/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-primary/20 bg-teal-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Respect is the hero metric
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-soft-text sm:text-3xl lg:text-4xl">
              How {agentLabel} is honoring patients
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-soft-text/75 sm:text-base">
              Every scored call reflects autonomy, pacing, and respect on sensitive
              skin and hair topics. The score is a rolling 30-day average on a
              1–5 scale.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-xl border border-soft-text/10 bg-white/70 px-3 py-2 text-xs text-soft-text/65 backdrop-blur-sm">
              <span className="font-medium text-soft-text/80">IST today</span>
              <span className="text-soft-text/40">·</span>
              <span className="font-mono tabular-nums">{ymd}</span>
            </p>
          </div>

          <div className="relative flex flex-col items-stretch gap-3 sm:flex-row sm:items-end lg:flex-col lg:items-end">
            <div className="relative w-full max-w-sm rounded-2xl border border-teal-primary/30 bg-gradient-to-b from-teal-primary/12 to-white p-6 shadow-lg shadow-teal-primary/15 sm:max-w-xs lg:w-72">
              <p className="text-xs font-semibold uppercase tracking-wider text-soft-text/60">
                30-day average
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums tracking-tight text-teal-primary sm:text-6xl">
                  {formatAvg(avg)}
                </span>
                <span className="text-2xl font-semibold text-soft-text/50">
                  /5
                </span>
              </div>
              {typeof avg === "number" ? (
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-teal-primary/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-primary to-teal-primary/70 transition-all"
                    style={{ width: `${Math.min(100, (avg / 5) * 100)}%` }}
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  No scored calls in the last 30 days yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionIntro
          icon={LayoutGrid}
          title="Today at a glance"
          subtitle="Volume metrics use IST midnight; the respect average uses scored calls from the last 30 days."
        />
        <DashboardStats
          leadsToday={kpis.leadsToday}
          callsCompletedToday={kpis.callsCompletedToday}
          consultationsBookedToday={kpis.consultationsBookedToday}
        />
      </section>

      <section>
        <SectionIntro
          icon={Users}
          title="Pipeline"
          subtitle="Open a call to read the transcript, summary, and respect score for that conversation."
        />
        <LeadsTable rows={leads} />
      </section>
    </div>
  );
}
