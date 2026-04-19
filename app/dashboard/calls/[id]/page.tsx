import Link from "next/link";
import { notFound } from "next/navigation";
import { CallTranscript } from "@/components/CallTranscript";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchCallDetail } from "@/lib/dashboard-metrics";
import { getSupabaseAdmin } from "@/lib/supabase";

function respectLabel(score: number | null): string {
  if (score === null) {
    return "Not scored";
  }
  if (score >= 5) {
    return "Exemplary autonomy";
  }
  if (score >= 4) {
    return "Strong respect";
  }
  if (score >= 3) {
    return "Adequate";
  }
  if (score >= 2) {
    return "Needs attention";
  }
  return "Review recommended";
}

export default async function CallDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const record = await fetchCallDetail(getSupabaseAdmin(), params.id);
  if (!record) {
    notFound();
  }

  const { call, lead } = record;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-teal-primary underline-offset-4 hover:underline"
        >
          ← Back to dashboard
        </Link>
        {lead ? (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Lead: {lead.name}
          </Badge>
        ) : null}
      </div>

      <section className="rounded-2xl border-2 border-teal-primary/40 bg-gradient-to-br from-teal-primary/25 via-white to-warm-off-white p-6 shadow-md sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-primary">
          Respect score
        </p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-6xl font-bold tabular-nums tracking-tight text-teal-primary sm:text-7xl">
                {call.respect_score ?? "-"}
              </span>
              {typeof call.respect_score === "number" ? (
                <span className="text-2xl font-semibold text-soft-text/70">
                  /5
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-medium text-soft-text">
              {respectLabel(call.respect_score)}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-soft-text/85 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Outcome</p>
              <p className="font-medium capitalize">
                {(call.outcome ?? "unknown").replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Duration</p>
              <p className="font-medium tabular-nums">
                {call.duration_seconds != null
                  ? `${call.duration_seconds}s`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Language</p>
              <p className="font-medium">{call.language_used ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Vapi call</p>
              <p className="break-all font-mono text-xs">
                {call.vapi_call_id ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {lead ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-soft-text">Lead</CardTitle>
            <CardDescription>Contact on file for this call.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium text-soft-text">{lead.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-mono text-soft-text">{lead.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="capitalize">{lead.status.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Preferred language</p>
              <p>{lead.language_preference ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-soft-text">Summary</CardTitle>
          <CardDescription>Claude-generated recap of the call.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-soft-text/90">
            {call.summary?.trim() || "No summary stored for this call yet."}
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-soft-text">Transcript</h2>
        <Separator className="mb-4" />
        <CallTranscript transcript={call.transcript} />
      </div>
    </div>
  );
}
