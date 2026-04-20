"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const LANGUAGE_DISPLAY: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "ml-IN": "Malayalam",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
  "kn-IN": "Kannada",
};

type FormData = {
  name: string;
  phone: string;
  concern: string;
  language_preference: string;
};

const initialForm: FormData = {
  name: "",
  phone: "",
  concern: "",
  language_preference: "hi-IN",
};

function validateForm(data: FormData): { name?: string; phone?: string } {
  const fieldErrors: { name?: string; phone?: string } = {};
  if (!data.name.trim() || data.name.trim().length < 2) {
    fieldErrors.name = "Please enter your name";
  }
  if (!data.phone.trim() || data.phone.trim().length < 7) {
    fieldErrors.phone = "Please enter a valid mobile number";
  }
  return fieldErrors;
}

/** When Vapi returns 202, explain limits without alarming the patient. */
function patientNoticeFromVapiDetail(detail: string): string {
  const d = detail.toLowerCase();
  if (d.includes("international") || d.includes("free vapi numbers")) {
    return "Our phone line could not start an automated call to your number on this setup. Trial lines often cannot dial internationally. Your request is saved; use the contact below if you need us sooner.";
  }
  return "We could not start the automated callback from this setup. Your request is saved; our team can still reach you.";
}

export default function LeadForm() {
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postSubmitNotice, setPostSubmitNotice] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedLanguage, setSubmittedLanguage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  const clinicPhone = process.env.NEXT_PUBLIC_CLINIC_PHONE?.trim();
  const phoneHelpLine = clinicPhone
    ? `Reach us at ${clinicPhone}`
    : "Reach us at our front desk";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextFieldErrors = validateForm(formData);
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPostSubmitNotice(null);

    const body: Record<string, unknown> = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      language_preference: formData.language_preference,
      source: "demo",
    };
    const concernTrim = formData.concern.trim();
    if (concernTrim) {
      body.concern = concernTrim;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let payload: {
        vapiDetail?: string;
        vapiError?: boolean;
      } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        payload = {};
      }

      if (res.status === 200) {
        setSubmittedName(formData.name.trim());
        setSubmittedLanguage(formData.language_preference);
        setPostSubmitNotice(null);
        setIsConfirmed(true);
        return;
      }

      if (res.status === 202) {
        setSubmittedName(formData.name.trim());
        setSubmittedLanguage(formData.language_preference);
        const detail =
          typeof payload.vapiDetail === "string" ? payload.vapiDetail : "";
        setPostSubmitNotice(patientNoticeFromVapiDetail(detail));
        setIsConfirmed(true);
        return;
      }

      setError("Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const langDisplay =
    LANGUAGE_DISPLAY[submittedLanguage] ?? submittedLanguage;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-warm-off-white text-soft-text">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-24 top-0 h-[22rem] w-[22rem] rounded-full bg-teal-primary/20 blur-3xl" />
        <div className="absolute right-[-10%] top-32 h-[26rem] w-[26rem] rounded-full bg-amber-100/50 blur-3xl" />
        <div className="absolute bottom-[-5%] left-[20%] h-72 w-72 rounded-full bg-teal-primary/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-soft-text/[0.08] bg-white/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="bd-crit-row mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-lg font-semibold tracking-tight text-soft-text sm:text-xl">
              Gloomindial
            </p>
            <p className="text-xs text-muted-foreground">Premium intake desk</p>
          </div>
        </div>
      </header>

      {!isConfirmed ? (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <section className="relative overflow-hidden rounded-3xl border border-teal-primary/25 bg-gradient-to-br from-white via-white to-teal-primary/[0.06] p-6 shadow-xl shadow-teal-primary/10 ring-1 ring-black/[0.03] sm:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-primary/25 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-soft-text sm:text-4xl">
                Expert skin and hair care, in the language of your heart
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-soft-text/75 sm:text-base">
                Fill a quick request and our care coordinator will call you back
                shortly with calm guidance and zero pressure.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-soft-text/10 bg-white/70 px-3 py-2 text-xs text-soft-text/65 backdrop-blur-sm">
                <span className="font-medium text-soft-text/80">📍 Bengaluru</span>
                <span className="text-soft-text/40">·</span>
                <span className="font-medium">Multi-language support</span>
              </p>

              <div className="mt-6 grid gap-3 text-sm text-soft-text/80 sm:grid-cols-2">
                <p className="rounded-2xl border border-soft-text/10 bg-white/80 px-4 py-3">
                  👨‍⚕️ Senior dermatologists only
                </p>
                <p className="rounded-2xl border border-soft-text/10 bg-white/80 px-4 py-3 sm:col-span-2">
                  📞 We call you within 60 seconds
                </p>
              </div>
            </div>
          </section>

          <section className="h-fit overflow-hidden rounded-3xl border border-soft-text/10 bg-white/95 shadow-lg shadow-black/[0.03] ring-1 ring-black/[0.02]">
            <div className="border-b border-soft-text/10 bg-gradient-to-r from-teal-primary/[0.06] to-transparent px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight text-soft-text">
                Book a Consultation
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Tell us what you&apos;re looking for. Our care coordinator will
                call you shortly.
              </p>
            </div>

            <form className="space-y-5 px-5 py-5 sm:px-6 sm:py-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="lead-name" className="text-[#2C3E3F]">
                  Your name
                </Label>
                <Input
                  id="lead-name"
                  name="name"
                  autoComplete="name"
                  placeholder="e.g. Meera Krishnan"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  className="h-11 border-soft-text/15 bg-white"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? "lead-name-error" : undefined}
                />
                {fieldErrors.name ? (
                  <p
                    id="lead-name-error"
                    className="text-sm text-red-500"
                    role="alert"
                  >
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-phone" className="text-[#2C3E3F]">
                  Mobile number
                </Label>
                <Input
                  id="lead-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. 98765 43210"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="h-11 border-soft-text/15 bg-white"
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? "lead-phone-error" : undefined}
                />
                <p className="text-xs text-soft-text/60">
                  We&apos;ll call you on this number within 60 seconds
                </p>
                {fieldErrors.phone ? (
                  <p
                    id="lead-phone-error"
                    className="text-sm text-red-500"
                    role="alert"
                  >
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-concern" className="text-[#2C3E3F]">
                  What would you like help with?
                </Label>
                <Textarea
                  id="lead-concern"
                  name="concern"
                  rows={3}
                  placeholder={
                    "e.g. acne, hair fall, laser treatment, pigmentation...\nYou can share as much or as little as you like."
                  }
                  value={formData.concern}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, concern: e.target.value }))
                  }
                  className="min-h-[5.5rem] resize-y border-soft-text/15 bg-white"
                />
                <p className="text-xs leading-relaxed text-soft-text/60">
                  This helps our coordinator understand your situation before
                  calling
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium leading-none text-[#2C3E3F]">
                  Preferred language
                </span>
                <LanguagePicker
                  value={formData.language_preference}
                  onChange={(code) =>
                    setFormData((p) => ({
                      ...p,
                      language_preference: code,
                    }))
                  }
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-base font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-primary focus-visible:ring-offset-2 disabled:opacity-70",
                    "bg-[#5B9EAA] shadow-md shadow-teal-primary/25 hover:bg-[#4f8e99]",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                      Connecting you...
                    </>
                  ) : (
                    "Request a call →"
                  )}
                </button>
                {error ? (
                  <p className="mt-2 text-sm text-red-500" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            </form>
          </section>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-soft-text/10 bg-white/75 px-4 py-3 text-xs text-soft-text/65 backdrop-blur-sm">
              <p className="flex items-center justify-center gap-2 text-center">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-primary" aria-hidden />
                Your information is private and never shared.
              </p>
            </div>
          </div>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-soft-text/10 bg-white/95 shadow-lg shadow-black/[0.03] ring-1 ring-black/[0.02]">
            <div className="border-b border-soft-text/10 bg-gradient-to-r from-teal-primary/[0.08] to-transparent px-5 py-5 text-center sm:px-8">
              <div className="flex justify-center">
                <CheckCircle2
                  className="h-16 w-16 text-teal-primary lead-confirm-check-animate"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-[#2C3E3F]">
                We&apos;ll call you shortly
              </h2>
              {postSubmitNotice ? (
                <p className="mt-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-left text-sm leading-relaxed text-soft-text/90">
                  {postSubmitNotice}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-soft-text/75">
                  Usually within 60 seconds. Please keep your phone nearby.
                </p>
              )}
              <p className="mt-4 text-sm text-[#2C3E3F]">
                Hi {submittedName}, we&apos;ve received your request.
              </p>
              <p className="mt-2 text-sm text-soft-text/80">
                Our coordinator will greet you in {langDisplay}
              </p>
            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-7">
              <Separator className="mb-6 bg-soft-text/10" />
              <p className="text-left text-sm font-semibold text-[#2C3E3F]">
                What to expect
              </p>
              <ul className="mt-3 space-y-3 text-left text-sm leading-relaxed text-soft-text/80">
                <li>📞 We&apos;ll call from an unknown number, please pick up</li>
                <li>💬 The call takes about 5–10 minutes</li>
              </ul>
              <p className="mt-6 text-xs leading-relaxed text-soft-text/60">
                Didn&apos;t receive a call? {phoneHelpLine}
              </p>
            </div>
          </section>
        </main>
      )}

      <footer className="border-t border-soft-text/10 bg-white/40 py-6 text-center text-xs text-soft-text/55 backdrop-blur-sm">
        © 2025 Gloomindial · Bengaluru
      </footer>
    </div>
  );
}
