import { HeartPulse } from "lucide-react";

export function DashboardBrand() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-primary to-teal-primary/70 text-white shadow-lg shadow-teal-primary/30"
        aria-hidden
      >
        <HeartPulse className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-primary">
          Clinic owner
        </p>
        <h1 className="truncate text-lg font-semibold tracking-tight text-soft-text sm:text-xl">
          Gloomindial
        </h1>
      </div>
    </div>
  );
}
