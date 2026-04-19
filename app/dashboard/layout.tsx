import type { Metadata } from "next";
import { DashboardBrand } from "@/components/DashboardBrand";
import { DashboardNav } from "@/components/DashboardNav";

export const metadata: Metadata = {
  title: "Dashboard | Gloomindial",
  description:
    "Clinic owner overview for skin & hair practices: leads, calls, and respect scores.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-warm-off-white">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-24 top-0 h-[22rem] w-[22rem] rounded-full bg-teal-primary/20 blur-3xl" />
        <div className="absolute right-[-10%] top-32 h-[26rem] w-[26rem] rounded-full bg-amber-100/50 blur-3xl" />
        <div className="absolute bottom-[-5%] left-[20%] h-72 w-72 rounded-full bg-teal-primary/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-soft-text/[0.08] bg-white/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="bd-crit-row mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <DashboardBrand />
          <DashboardNav />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
