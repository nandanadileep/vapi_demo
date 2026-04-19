"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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

export default function LeadForm() {
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      if (res.status === 200 || res.status === 202) {
        setSubmittedName(formData.name.trim());
        setSubmittedLanguage(formData.language_preference);
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
    <div className="flex min-h-screen flex-col bg-warm-off-white text-[#2C3E3F]">
      {/* Hero */}
      <header className="w-full bg-teal-primary px-4 pb-10 pt-10 text-center sm:pb-12 sm:pt-14">
        <h1 className="text-4xl font-light tracking-tight text-white sm:text-5xl">
          Gloomindial
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/95 sm:text-lg">
          Expert skin and hair care, in the language of your heart
        </p>
        <p className="mt-3 text-sm text-white/70">📍 Bengaluru</p>
      </header>

      {!isConfirmed ? (
        <>
          {/* Trust bar */}
          <div className="border-b border-soft-text/10 bg-white px-4 py-3">
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

          <main className="flex flex-1 flex-col px-4 py-8 sm:py-10">
            <div className="mx-auto w-full max-w-md flex-1">
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-[#2C3E3F]">
                  Book a Consultation
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-soft-text/75">
                  Tell us what you&apos;re looking for. Our care coordinator will
                  call you shortly.
                </p>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
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
                      className="border-soft-text/15"
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
                      className="border-soft-text/15"
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
                      className="min-h-[5.5rem] resize-y border-soft-text/15"
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
                        "flex h-11 w-full items-center justify-center gap-2 rounded-lg text-base font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-primary focus-visible:ring-offset-2 disabled:opacity-70",
                        "bg-[#5B9EAA] hover:bg-[#4f8e99]",
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

              <p className="mt-6 text-center text-xs text-soft-text/60">
                🔒 Your information is private and never shared.
              </p>
            </div>
          </main>
        </>
      ) : (
        <main className="flex flex-1 flex-col px-4 py-8 sm:py-10">
          <div className="mx-auto w-full max-w-md flex-1">
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
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
              <p className="mt-2 text-sm leading-relaxed text-soft-text/75">
                Usually within 60 seconds. Please keep your phone nearby.
              </p>
              <p className="mt-4 text-sm text-[#2C3E3F]">
                Hi {submittedName}, we&apos;ve received your request.
              </p>
              <p className="mt-2 text-sm text-soft-text/80">
                Our coordinator will greet you in {langDisplay}
              </p>

              <Separator className="my-6 bg-soft-text/10" />

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
        </main>
      )}

      <footer className="mt-auto border-t border-soft-text/10 py-6 text-center text-xs text-soft-text/55">
        © 2025 Gloomindial · Bengaluru
      </footer>
    </div>
  );
}
