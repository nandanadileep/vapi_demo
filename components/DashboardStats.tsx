import { CalendarCheck, PhoneCall, UserPlus } from "lucide-react";
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
};

/**
 * Three KPI cards for today's clinic dashboard activity.
 */
export function DashboardStats({
  leadsToday,
  callsCompletedToday,
  consultationsBookedToday,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

    </div>
  );
}
