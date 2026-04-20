"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
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
    return "Our phone line could not start an automated call to your number on this setup—trial lines often cannot dial internationally. Your request is saved; use the contact below if you need us sooner.";
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-warm-off-white text-[#2C3E3F]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-teal-primary/15 blur-3xl" />
        <div className="absolute right-[-10%] top-16 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" />
      </div>

      <header className="relative border-b border-white/20 bg-gradient-to-b from-teal-primary to-[#4D8E99] px-4 pb-14 pt-10 text-center sm:pb-16 sm:pt-14">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Premium care intake
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight text-white sm:text-5xl">
          Gloomindial
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/95 sm:text-lg">
          Expert skin and hair care, in the language of your heart
        </p>
        <p className="mt-3 text-sm text-white/75">📍 Bengaluru</p>
      </header>

      {!isConfirmed ? (
        <>
          <div className="relative border-b border-soft-text/10 bg-white/90 px-4 py-3 backdrop-blur-sm">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-1 gap-y-2 text-center text-xs text-soft-text/65 sm:text-sm">
              <span className="whitespace-nowrap">✨ No pressure, ever</span>
              <span className="hidden text-soft-text/35 sm:inline" aria-hidden>
                |
              </span>
              <span className="whitespace-nowrap">
                👨‍⚕️ Senior dermatologists only
              </span>
              <span className="hidden text-soft-text/35 sm:inline" aria-hidden>
                |
              </span>
              <span className="whitespace-nowrap">
                📞 We call you within 60 seconds
              </span>
            </div>
          </div>

          <main className="relative flex flex-1 flex-col px-4 py-8 sm:py-10">
            <div className="mx-auto w-full max-w-xl flex-1">
              <div className="overflow-hidden rounded-[28px] border border-soft-text/10 bg-white shadow-[0_10px_40px_rgba(44,62,63,0.10)]">
                <div className="border-b border-soft-text/10 bg-gradient-to-r from-teal-primary/10 via-white to-white px-6 py-5 sm:px-8">
                  <h2 className="text-xl font-semibold text-[#2C3E3F] sm:text-2xl">
                    Book a Consultation
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-soft-text/75 sm:text-[15px]">
                    Tell us what you&apos;re looking for. Our care coordinator will
                    call you shortly.
                  </p>
                </div>

                <form className="space-y-5 px-6 py-6 sm:px-8 sm:py-7" onSubmit={handleSubmit} noValidate>
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
                      className="h-11 border-soft-text/15 bg-white/95"
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={
                        fieldErrors.name ? "lead-name-error" : undefined
                      }
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
                      className="h-11 border-soft-text/15 bg-white/95"
                      aria-invalid={!!fieldErrors.phone}
                      aria-describedby={
                        fieldErrors.phone ? "lead-phone-error" : undefined
                      }
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
                      className="min-h-[5.5rem] resize-y border-soft-text/15 bg-white/95"
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
                          <Loader2
                            className="h-5 w-5 shrink-0 animate-spin"
                            aria-hidden
                          />
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
              </div>

              <div className="mt-5 rounded-2xl border border-soft-text/10 bg-white/75 px-4 py-3 text-xs text-soft-text/65 backdrop-blur-sm">
                <p className="flex items-center justify-center gap-2 text-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-primary" aria-hidden />
                  Your information is private and never shared.
                </p>
              </div>
            </div>
          </main>
        </>
      ) : (
        <main className="relative flex flex-1 flex-col px-4 py-8 sm:py-10">
          <div className="mx-auto w-full max-w-xl flex-1">
            <div className="overflow-hidden rounded-[28px] border border-soft-text/10 bg-white shadow-[0_10px_40px_rgba(44,62,63,0.10)]">
              <div className="border-b border-soft-text/10 bg-gradient-to-r from-teal-primary/10 via-white to-white px-6 py-5 text-center sm:px-8">
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

              <div className="px-6 py-6 sm:px-8 sm:py-7">
                <Separator className="mb-6 bg-soft-text/10" />

                <p className="text-left text-sm font-semibold text-[#2C3E3F]">
                  What to expect
                </p>
                <ul className="mt-3 space-y-3 text-left text-sm leading-relaxed text-soft-text/80">
                  <li>
                    📞 We&apos;ll call from an unknown number — please pick up
                  </li>
                  <li>💬 The call takes about 5–10 minutes</li>
                  <li>✨ No pressure. You can end the call anytime.</li>
                </ul>

                <p className="mt-6 text-xs leading-relaxed text-soft-text/60">
                  Didn&apos;t receive a call? {phoneHelpLine}
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      <footer className="relative mt-auto border-t border-soft-text/10 bg-white/40 py-6 text-center text-xs text-soft-text/55 backdrop-blur-sm">
        © 2025 Gloomindial · Bengaluru
      </footer>
    </div>
  );
}
