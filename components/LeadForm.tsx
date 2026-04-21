"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Vapi from "@vapi-ai/web";
import {
  CheckCircle2,
  HeartPulse,
  Loader2,
  PhoneCall,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";
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

type LeadFormProps = {
  clinicName: string;
  clinicCity: string;
};

type WebCallState = "idle" | "connecting" | "live";

const initialForm: FormData = {
  name: "",
  phone: "",
  concern: "",
  language_preference: "hi-IN",
};

const LANGUAGE_LOCK_TEXT: Record<string, string> = {
  "en-IN":
    "Continue the full call in English unless the patient clearly switches language.",
  "hi-IN":
    "Continue the full call in Hindi unless the patient clearly switches language.",
  "ml-IN":
    "Continue the full call in Malayalam unless the patient clearly switches language.",
  "ta-IN":
    "Continue the full call in Tamil unless the patient clearly switches language.",
  "te-IN":
    "Continue the full call in Telugu unless the patient clearly switches language.",
  "kn-IN":
    "Continue the full call in Kannada unless the patient clearly switches language.",
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

function describeWebCallError(error: unknown): string {
  const fallback = "Could not start browser call. Please try again.";

  if (typeof error === "string" && error.trim()) {
    const text = error.trim();
    const lower = text.toLowerCase();
    if (lower.includes("meeting ended due to ejection")) {
      return "Browser call disconnected immediately. Publish the assistant, then verify Voice + Transcriber settings in Vapi.";
    }
    return text;
  }
  if (error && typeof error === "object") {
    const maybeRecord = error as Record<string, unknown>;
    const fields = ["message", "error", "details", "reason"] as const;
    for (const field of fields) {
      const value = maybeRecord[field];
      if (typeof value === "string" && value.trim()) {
        const text = value.trim();
        const lower = text.toLowerCase();
        if (lower.includes("meeting ended due to ejection")) {
          return "Browser call disconnected immediately. Publish the assistant, then verify Voice + Transcriber settings in Vapi.";
        }
        return text;
      }
    }
    try {
      const asJson = JSON.stringify(error);
      if (asJson && asJson !== "{}") {
        return asJson;
      }
    } catch {
      // ignore json serialization issues
    }
  }
  return fallback;
}

function buildWebFirstMessage(params: {
  language: string;
  name: string;
  clinicName: string;
  agentName: string;
}): string {
  const cleanName = params.name.trim() || "there";
  const cleanClinic = params.clinicName.trim() || "our clinic";
  const cleanAgent = params.agentName.trim() || "our care coordinator";

  const byLanguage: Record<string, string> = {
    "en-IN": `Hi ${cleanName}, welcome to ${cleanClinic}. This is ${cleanAgent}. I'm here to understand what you need and help calmly, no pressure.`,
    "hi-IN": `Namaste ${cleanName} ji, ${cleanClinic} mein aapka swagat hai. Main ${cleanAgent} bol rahi hoon. Aapko jis cheez mein madad chahiye, hum aaraam se baat karte hain, bina kisi pressure ke.`,
    "ml-IN": `Namaskaram ${cleanName}, ${cleanClinic}-ilekku swagatham. Njaan ${cleanAgent}. Ningalkku entha sahayam venam ennu nammal shaantamaayi samsaarikkaam, yathoru pressure um illa.`,
    "ta-IN": `Vanakkam ${cleanName}, ${cleanClinic}-ku varaverpu. Naan ${cleanAgent}. Ungalukku thevaiyana help-ai amaidhiya pesi purinjukalam, yendha pressure-um illai.`,
    "te-IN": `Namaskaram ${cleanName}, ${cleanClinic} ki swagatham. Nenu ${cleanAgent}. Mee avasaram enti anedi nidhanaanga maatlaadukundam, emi pressure undadu.`,
    "kn-IN": `Namaskara ${cleanName}, ${cleanClinic}-ge swagata. Naanu ${cleanAgent}. Nimge yen sahaya beku antha nidhanaagi maatadona, yava pressure illa.`,
  };

  return byLanguage[params.language] ?? byLanguage["en-IN"];
}

function buildWebVoiceOverride(params: {
  voiceId: string;
  model: "tts-1" | "tts-1-hd" | "gpt-4o-mini-tts";
}): { provider: "openai"; voiceId: string; model: "tts-1" | "tts-1-hd" | "gpt-4o-mini-tts" } {
  return {
    provider: "openai",
    voiceId: params.voiceId,
    model: params.model,
  };
}

function buildWebTranscriberOverride(params: {
  language: string;
  modelEn: string;
  modelMulti: string;
  eotTimeoutMs: number;
  eotThreshold: number;
}): {
  provider: "deepgram";
  model: string;
  language: string;
  eotTimeoutMs: number;
  eotThreshold: number;
} {
  const useEnglish = params.language === "en-IN";
  const model = useEnglish ? params.modelEn : params.modelMulti;
  const fluxLanguageByLocale: Record<string, string> = {
    "en-IN": "en",
    "hi-IN": "hi",
    // Flux multilingual does not support ta/ml/te/kn yet.
    // Use Hindi fallback to keep call start stable.
    "ta-IN": "hi",
    "ml-IN": "hi",
    "te-IN": "hi",
    "kn-IN": "hi",
  };
  return {
    provider: "deepgram",
    model,
    language: fluxLanguageByLocale[params.language] ?? "hi",
    eotTimeoutMs: params.eotTimeoutMs,
    eotThreshold: params.eotThreshold,
  };
}

export default function LeadForm({ clinicName, clinicCity }: LeadFormProps) {
  const vapiRef = useRef<Vapi | null>(null);
  const activeWebLanguageRef = useRef<string>("en-IN");
  const activeWebLeadContextRef = useRef<{
    name: string;
    phone: string;
    concern: string;
  }>({ name: "", phone: "", concern: "" });
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postSubmitNotice, setPostSubmitNotice] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [submittedLanguage, setSubmittedLanguage] = useState("");
  const [submittedCallMode, setSubmittedCallMode] = useState<"phone" | "web">(
    "phone",
  );
  const [webCallState, setWebCallState] = useState<WebCallState>("idle");
  const [webCallError, setWebCallError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim();
  const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.trim();
  const publicAgentName = process.env.NEXT_PUBLIC_AGENT_NAME?.trim();
  const webVoiceId = process.env.NEXT_PUBLIC_VAPI_WEB_VOICE_ID?.trim() || "alloy";
  const webVoiceModel =
    (process.env.NEXT_PUBLIC_VAPI_WEB_VOICE_MODEL?.trim() as
      | "tts-1"
      | "tts-1-hd"
      | "gpt-4o-mini-tts"
      | undefined) || "tts-1";
  const webTranscriberModelEn =
    process.env.NEXT_PUBLIC_VAPI_WEB_TRANSCRIBER_MODEL_EN?.trim() ||
    "flux-general-en";
  const webTranscriberModelMulti =
    process.env.NEXT_PUBLIC_VAPI_WEB_TRANSCRIBER_MODEL_MULTI?.trim() ||
    "flux-general-multi";
  const webEotTimeoutMs = Number.parseInt(
    process.env.NEXT_PUBLIC_VAPI_WEB_EOT_TIMEOUT_MS?.trim() || "5000",
    10,
  );
  const webEotThreshold = Number.parseFloat(
    process.env.NEXT_PUBLIC_VAPI_WEB_EOT_THRESHOLD?.trim() || "0.7",
  );
  const canStartWebCall = Boolean(vapiPublicKey && vapiAssistantId);

  const clinicPhone = process.env.NEXT_PUBLIC_CLINIC_PHONE?.trim();
  const phoneHelpLine = clinicPhone
    ? `Reach us at ${clinicPhone}`
    : "Reach us at our front desk";

  useEffect(() => {
    return () => {
      if (!vapiRef.current) {
        return;
      }
      try {
        vapiRef.current.stop();
      } catch {
        // noop
      }
      vapiRef.current = null;
    };
  }, []);

  function ensureVapiClient(): Vapi | null {
    if (vapiRef.current) {
      return vapiRef.current;
    }
    if (!vapiPublicKey) {
      return null;
    }
    const client = new Vapi(vapiPublicKey);
    client.on("call-start", () => {
      setWebCallState("live");
      setWebCallError(null);
      const lang = activeWebLanguageRef.current;
      const leadCtx = activeWebLeadContextRef.current;
      const lockInstruction =
        LANGUAGE_LOCK_TEXT[lang] ?? LANGUAGE_LOCK_TEXT["en-IN"];
      client.send({
        type: "add-message",
        message: {
          role: "system",
          content: `${lockInstruction} Keep your tone calm, supportive, and never salesy. Intake data already exists: name=${leadCtx.name || "unknown"}, phone=${leadCtx.phone || "unknown"}, concern=${leadCtx.concern || "not provided"}. Do NOT ask again for name/phone for booking. If booking intent is clear, go to slots and booking directly. Keep replies concise and avoid random extra topics.`,
        },
        triggerResponseEnabled: false,
      });
    });
    client.on("call-end", () => {
      setWebCallState("idle");
    });
    client.on("error", (error) => {
      setWebCallState("idle");
      setWebCallError(describeWebCallError(error));
    });
    client.on("call-start-failed", (event) => {
      setWebCallState("idle");
      const reason = typeof event?.error === "string" ? event.error : "unknown";
      const stage = typeof event?.stage === "string" ? event.stage : "startup";
      setWebCallError(`Call start failed at ${stage}: ${reason}`);
    });
    vapiRef.current = client;
    return client;
  }

  async function handleWebCallToggle() {
    if (!canStartWebCall || !vapiAssistantId) {
      setWebCallError(
        "Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY or NEXT_PUBLIC_VAPI_ASSISTANT_ID.",
      );
      return;
    }
    const client = ensureVapiClient();
    if (!client) {
      setWebCallError(
        "Could not initialize browser call. Please verify Vapi web settings.",
      );
      return;
    }
    setWebCallError(null);
    try {
      if (webCallState === "live" || webCallState === "connecting") {
        client.stop();
        setWebCallState("idle");
        return;
      }
      setWebCallState("connecting");
      const preferredLanguage = submittedLanguage || formData.language_preference;
      const preferredName = submittedName || formData.name.trim();
      const preferredPhone = submittedPhone || formData.phone.trim();
      const preferredConcern = formData.concern.trim();
      activeWebLanguageRef.current = preferredLanguage;
      activeWebLeadContextRef.current = {
        name: preferredName,
        phone: preferredPhone,
        concern: preferredConcern,
      };
      const firstMessage = buildWebFirstMessage({
        language: preferredLanguage,
        name: preferredName,
        clinicName,
        agentName: publicAgentName || "our care coordinator",
      });
      const voiceOverride = buildWebVoiceOverride({
        voiceId: webVoiceId,
        model: webVoiceModel,
      });
      const transcriberOverride = buildWebTranscriberOverride({
        language: preferredLanguage,
        modelEn: webTranscriberModelEn,
        modelMulti: webTranscriberModelMulti,
        eotTimeoutMs:
          Number.isFinite(webEotTimeoutMs) && webEotTimeoutMs > 0
            ? webEotTimeoutMs
            : 5000,
        eotThreshold:
          Number.isFinite(webEotThreshold) && webEotThreshold > 0
            ? webEotThreshold
            : 0.7,
      });
      const baseOverrides = {
        firstMessageMode: "assistant-speaks-first" as const,
        firstMessage,
        voice: voiceOverride,
        transcriber: transcriberOverride,
        variableValues: {
          name: preferredName,
          language_preference: preferredLanguage,
          clinic_name: clinicName,
        },
      };
      await client.start(vapiAssistantId, baseOverrides);
    } catch (err) {
      setWebCallState("idle");
      setWebCallError(describeWebCallError(err));
    }
  }

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
        callMode?: "phone" | "web";
        error?: string;
        issues?: Array<{ path?: Array<string | number>; message?: string }>;
      } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        payload = {};
      }

      if (res.status === 200) {
        setSubmittedName(formData.name.trim());
        setSubmittedPhone(formData.phone.trim());
        setSubmittedLanguage(formData.language_preference);
        setSubmittedCallMode(payload.callMode === "web" ? "web" : "phone");
        setWebCallState("idle");
        setWebCallError(null);
        setPostSubmitNotice(null);
        setIsConfirmed(true);
        return;
      }

      if (res.status === 202) {
        setSubmittedName(formData.name.trim());
        setSubmittedPhone(formData.phone.trim());
        setSubmittedLanguage(formData.language_preference);
        setSubmittedCallMode("phone");
        setWebCallState("idle");
        setWebCallError(null);
        const detail =
          typeof payload.vapiDetail === "string" ? payload.vapiDetail : "";
        setPostSubmitNotice(patientNoticeFromVapiDetail(detail));
        setIsConfirmed(true);
        return;
      }

      if (res.status === 400) {
        const issueText = Array.isArray(payload.issues)
          ? payload.issues
              .map((issue) => issue.message)
              .filter((msg): msg is string => typeof msg === "string" && msg.length > 0)
              .join(" ")
          : "";
        if (issueText) {
          setError(issueText);
          return;
        }
        if (typeof payload.error === "string" && payload.error.trim()) {
          setError(payload.error.trim());
          return;
        }
      }

      setError(
        typeof payload.error === "string" && payload.error.trim()
          ? payload.error.trim()
          : "Something went wrong. Please try again.",
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const langDisplay =
    LANGUAGE_DISPLAY[submittedLanguage] ?? submittedLanguage;
  const showWebCallCta = submittedCallMode === "web";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-warm-off-white text-soft-text">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-24 top-0 h-[22rem] w-[22rem] rounded-full bg-teal-primary/20 blur-3xl" />
        <div className="absolute right-[-10%] top-32 h-[26rem] w-[26rem] rounded-full bg-amber-100/50 blur-3xl" />
        <div className="absolute bottom-[-5%] left-[20%] h-72 w-72 rounded-full bg-teal-primary/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-soft-text/[0.08] bg-white/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="bd-crit-row mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-4 sm:justify-start sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-primary to-teal-primary/70 text-white shadow-lg shadow-teal-primary/30"
              aria-hidden
            >
              <HeartPulse className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold tracking-tight text-soft-text sm:text-xl">
                {clinicName}
              </p>
              <p className="text-xs text-muted-foreground">Booking desk</p>
            </div>
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
              <div className="mt-6">
                <p className="rounded-2xl border border-soft-text/10 bg-white/80 px-4 py-3 text-sm text-soft-text/80">
                  👨‍⚕️ Senior dermatologists only &nbsp; | &nbsp; 📞 We call you within 60 seconds
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
                  {showWebCallCta
                    ? "Your request is saved. Start the browser call below for a free test run."
                    : "Usually within 60 seconds. Please keep your phone nearby."}
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
                <li>
                  {showWebCallCta
                    ? "🎧 The browser call starts in this tab with microphone access"
                    : "📞 We&apos;ll call from an unknown number, please pick up"}
                </li>
                <li>💬 The call takes about 5–10 minutes</li>
              </ul>
              {showWebCallCta ? (
                <div className="mt-5">
                  {canStartWebCall ? (
                    <button
                      type="button"
                      onClick={handleWebCallToggle}
                      disabled={webCallState === "connecting"}
                      className={cn(
                        "inline-flex h-11 w-full items-center justify-center rounded-xl text-base font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-primary focus-visible:ring-offset-2",
                        webCallState === "live"
                          ? "bg-slate-700 hover:bg-slate-800"
                          : "bg-[#5B9EAA] shadow-md shadow-teal-primary/25 hover:bg-[#4f8e99]",
                        webCallState === "connecting" && "opacity-70",
                      )}
                    >
                      {webCallState === "connecting" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          Connecting...
                        </>
                      ) : webCallState === "live" ? (
                        <>
                          <PhoneOff className="mr-2 h-4 w-4" aria-hidden />
                          End test
                        </>
                      ) : (
                        <>
                          <PhoneCall className="mr-2 h-4 w-4" aria-hidden />
                          Test
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-sm leading-relaxed text-soft-text/90">
                      Browser call mode is on, but `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
                      or `NEXT_PUBLIC_VAPI_ASSISTANT_ID` is missing.
                    </p>
                  )}
                  {webCallError ? (
                    <p className="mt-2 text-sm text-red-500" role="alert">
                      {webCallError}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-soft-text/60">
                      Browser may ask for microphone permission before starting.
                    </p>
                  )}
                </div>
              ) : null}
              <p className="mt-6 text-xs leading-relaxed text-soft-text/60">
                Didn&apos;t receive a call? {phoneHelpLine}
              </p>
            </div>
          </section>
        </main>
      )}

      <footer className="border-t border-soft-text/10 bg-white/40 py-6 text-center text-xs text-soft-text/55 backdrop-blur-sm">
        © {new Date().getFullYear()} {clinicName} · {clinicCity}
      </footer>
    </div>
  );
}
