import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Users } from "lucide-react";
import { getAgentDisplayNameSentenceCase } from "@/lib/agent-name";
import { DashboardStats } from "@/components/DashboardStats";

/** Read `AGENT_NAME` at request time (not at build) for clinic-specific branding. */
export const dynamic = "force-dynamic";
import { LeadsTable } from "@/components/LeadsTable";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  fetchDashboardKpis,
  fetchLeadsForDashboard,
} from "@/lib/dashboard-metrics";

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

        <div className="relative">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-soft-text sm:text-3xl lg:text-4xl">
              How {agentLabel} is honoring patients
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-soft-text/75 sm:text-base">
              Every call reflects autonomy, pacing, and respect on sensitive skin
              and hair topics.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionIntro
          icon={LayoutGrid}
          title="Today at a glance"
          subtitle="Volume metrics for today."
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
