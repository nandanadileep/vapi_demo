import { Award, CalendarCheck, PhoneCall, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type DashboardStatsProps = {
  leadsToday: number;
  callsCompletedToday: number;
  consultationsBookedToday: number;
  avgRespectScore30d: number | null;
};

function formatAvg(v: number | null): string {
  if (v === null || Number.isNaN(v)) {
    return "-";
  }
  return v.toFixed(1);
}

/**
 * Four KPI cards for the clinic dashboard; respect average is visually emphasized.
 */
export function DashboardStats({
  leadsToday,
  callsCompletedToday,
  consultationsBookedToday,
  avgRespectScore30d,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="group border-soft-text/10 bg-white/90 shadow-sm transition hover:border-teal-primary/25 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardDescription>Leads today</CardDescription>
            <CardTitle className="mt-1 text-3xl font-bold tabular-nums text-soft-text">
              {leadsToday}
            </CardTitle>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-primary/10 text-teal-primary transition group-hover:bg-teal-primary/15">
            <UserPlus className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-muted-foreground">
          New leads captured since midnight IST.
        </CardContent>
      </Card>

      <Card className="group border-soft-text/10 bg-white/90 shadow-sm transition hover:border-teal-primary/25 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardDescription>Calls completed today</CardDescription>
            <CardTitle className="mt-1 text-3xl font-bold tabular-nums text-soft-text">
              {callsCompletedToday}
            </CardTitle>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-primary/10 text-teal-primary transition group-hover:bg-teal-primary/15">
            <PhoneCall className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-muted-foreground">
          Calls with an end time today (IST).
        </CardContent>
      </Card>

      <Card className="group border-soft-text/10 bg-white/90 shadow-sm transition hover:border-teal-primary/25 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardDescription>Consultations booked today</CardDescription>
            <CardTitle className="mt-1 text-3xl font-bold tabular-nums text-soft-text">
              {consultationsBookedToday}
            </CardTitle>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-primary/10 text-teal-primary transition group-hover:bg-teal-primary/15">
            <CalendarCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-muted-foreground">
          Bookings recorded today (IST).
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-teal-primary/35 bg-gradient-to-br from-teal-primary/[0.12] via-white to-amber-50/40 shadow-md ring-1 ring-teal-primary/20 transition hover:shadow-lg">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-primary/20 blur-2xl"
          aria-hidden
        />
        <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardDescription className="font-semibold text-teal-primary">
              Avg respect score (30d)
            </CardDescription>
            <CardTitle className="mt-1 flex items-baseline gap-1 text-4xl font-bold tabular-nums tracking-tight text-teal-primary">
              {formatAvg(avgRespectScore30d)}
              <span className="text-xl font-semibold text-soft-text/70">/5</span>
            </CardTitle>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-teal-primary shadow-sm ring-1 ring-teal-primary/15">
            <Award className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
        </CardHeader>
        <CardContent className="relative text-xs leading-relaxed text-soft-text/75">
          Autonomy, pacing, and respectful tone across scored calls.
        </CardContent>
      </Card>
    </div>
  );
}
