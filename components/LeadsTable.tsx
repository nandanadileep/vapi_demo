import Link from "next/link";
import { Inbox, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeadTableRow } from "@/lib/dashboard-metrics";

export type LeadsTableProps = {
  rows: LeadTableRow[];
};

function respectTone(score: number | null): string {
  if (score === null) {
    return "border-muted-foreground/30 bg-muted text-muted-foreground";
  }
  if (score >= 4) {
    return "border-teal-primary/50 bg-teal-primary/10 text-teal-primary";
  }
  if (score >= 3) {
    return "border-amber-500/40 bg-amber-50 text-amber-900";
  }
  return "border-destructive/30 bg-destructive/10 text-destructive";
}

function formatWhen(iso: string): string {
  const d = Date.parse(iso);
  if (Number.isNaN(d)) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Recent leads with latest-call respect score highlighted; links to call detail when a call exists.
 */
export function LeadsTable({ rows }: LeadsTableProps) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-teal-primary/25 bg-white/80 px-6 py-16 text-center shadow-inner">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-primary/10 text-teal-primary">
          <Inbox className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-5 max-w-sm text-base font-medium text-soft-text">
          No leads in the pipeline yet
        </p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          When patients reach out through your intake flow, they will show up
          here with status and their latest scored call.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-soft-text/10 bg-white/95 shadow-lg shadow-black/[0.03] ring-1 ring-black/[0.02]">
      <div className="border-b border-soft-text/10 bg-gradient-to-r from-teal-primary/[0.06] to-transparent px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-soft-text">Recent leads</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-soft-text/10 hover:bg-transparent">
            <TableHead className="w-28 pl-5 text-soft-text sm:pl-6">
              Respect
            </TableHead>
            <TableHead className="text-soft-text">Name</TableHead>
            <TableHead className="text-soft-text">Phone</TableHead>
            <TableHead className="text-soft-text">Status</TableHead>
            <TableHead className="text-soft-text">Created</TableHead>
            <TableHead className="pr-5 text-right text-soft-text sm:pr-6">
              Call
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.leadId}
              className="border-soft-text/[0.06] transition-colors hover:bg-teal-primary/[0.04]"
            >
              <TableCell className="pl-5 sm:pl-6">
                <Badge
                  variant="outline"
                  className={`min-w-[3.25rem] justify-center px-2.5 py-0.5 text-sm font-semibold tabular-nums ${respectTone(r.latestRespectScore)}`}
                >
                  {r.latestRespectScore ?? "-"}
                </Badge>
              </TableCell>
              <TableCell className="font-medium text-soft-text">{r.name}</TableCell>
              <TableCell className="font-mono text-xs text-soft-text/85">
                {r.phone}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {r.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatWhen(r.createdAt)}
              </TableCell>
              <TableCell className="pr-5 text-right sm:pr-6">
                {r.latestCallId ? (
                  <Link
                    href={`/dashboard/calls/${r.latestCallId}`}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-primary/10 px-3 py-1.5 text-sm font-semibold text-teal-primary transition hover:bg-teal-primary/18"
                  >
                    View
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
