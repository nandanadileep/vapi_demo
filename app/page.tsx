import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  HeartPulse,
  Mic2,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-warm-off-white text-soft-text">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-28 top-0 h-[24rem] w-[24rem] rounded-full bg-teal-primary/25 blur-3xl" />
        <div className="absolute right-[-15%] top-36 h-[28rem] w-[28rem] rounded-full bg-amber-100/55 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[15%] h-80 w-80 rounded-full bg-teal-primary/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-soft-text/[0.08] bg-white/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="bd-crit-row mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-teal-primary/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-primary to-teal-primary/75 text-white shadow-lg shadow-teal-primary/30">
              <HeartPulse className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">Bloomindial</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" asChild className="rounded-full text-soft-text/80">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-full bg-teal-primary px-5 text-white shadow-md shadow-teal-primary/25 hover:bg-teal-primary/90"
            >
              <Link href="/dashboard" className="gap-2">
                Open app
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-primary/25 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Voice-first skin & hair clinics
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-soft-text sm:text-5xl lg:text-6xl">
              Care that sounds{" "}
              <span className="bg-gradient-to-r from-teal-primary to-teal-primary/70 bg-clip-text text-transparent">
                human
              </span>
              , scales like software
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Bloomindial helps dermatology and skin & hair clinics greet every
              lead with warmth, track every call with clarity, and show respect for
              patient autonomy, not just volume.
            </p>
            <div className="bd-crit-cta mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 min-w-[200px] rounded-full bg-teal-primary text-base text-white shadow-lg shadow-teal-primary/30 hover:bg-teal-primary/90"
              >
                <Link href="/dashboard" className="gap-2">
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-full border-soft-text/15 bg-white/80 px-6 text-base backdrop-blur-sm"
              >
                <Link href="/dashboard">Clinic owner view</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-5 sm:mt-20 sm:grid-cols-3 sm:gap-6">
            <Card className="group border-soft-text/10 bg-white/90 shadow-md transition hover:-translate-y-0.5 hover:border-teal-primary/25 hover:shadow-lg">
              <CardHeader>
                <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-primary/12 text-teal-primary transition group-hover:bg-teal-primary/18">
                  <Mic2 className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <CardTitle className="text-lg text-soft-text">
                  Outbound voice agent
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Calls patients back in their language with calm pacing: no
                  hard sell, no scripted pressure.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-soft-text/10 bg-white/90 shadow-md transition hover:-translate-y-0.5 hover:border-teal-primary/25 hover:shadow-lg">
              <CardHeader>
                <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-primary/12 text-teal-primary transition group-hover:bg-teal-primary/18">
                  <BarChart3 className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <CardTitle className="text-lg text-soft-text">
                  Owner dashboard
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Leads, completed calls, bookings, and a rolling respect score so
                  you see quality, not just activity.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-soft-text/10 bg-white/90 shadow-md transition hover:-translate-y-0.5 hover:border-teal-primary/25 hover:shadow-lg">
              <CardHeader>
                <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-primary/12 text-teal-primary transition group-hover:bg-teal-primary/18">
                  <Shield className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <CardTitle className="text-lg text-soft-text">
                  Safety & consent
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Suppression and callback rules are enforced in the database, so
                  promises made on the call are not “prompt-only.”
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="border-t border-soft-text/10 bg-gradient-to-b from-white/80 to-teal-primary/[0.04] py-14 sm:py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-soft-text sm:text-3xl">
                Ready when your team is
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Open the dashboard to see today’s pipeline, respect trends, and
                call-level detail in one calm surface.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shrink-0 rounded-full px-8 text-base shadow-md"
            >
              <Link href="/dashboard" className="gap-2">
                Launch dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-soft-text/10 py-8 text-center text-xs text-muted-foreground">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p>Bloomindial | Voice-first outreach for skin & hair clinics</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
