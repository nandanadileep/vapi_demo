/**
 * Checks that .env.local defines required keys (non-empty). Does not print values.
 * Usage: node scripts/verify-env.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function parseEnvFile(content) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function nonempty(env, key) {
  return Boolean(env[key]?.trim());
}

function validHttpUrl(value) {
  try {
    const u = new URL(String(value).trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

if (!fs.existsSync(envPath)) {
  console.error("FAIL: .env.local not found at", envPath);
  process.exit(1);
}

const env = parseEnvFile(fs.readFileSync(envPath, "utf8"));

const always = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_BASE_URL",
  "VAPI_API_KEY",
  "VAPI_PHONE_NUMBER_ID",
  "CLINIC_NAME",
  "CLINIC_CITY",
  "CLINIC_PHONE",
  "SARVAM_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_CALENDAR_ID",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
];

const missing = always.filter((k) => !nonempty(env, k));

const modeRaw = (env.TWILIO_MESSAGING_MODE || "").trim().toLowerCase();
let useSms = modeRaw === "sms";
if (
  !modeRaw &&
  nonempty(env, "TWILIO_SMS_FROM") &&
  !nonempty(env, "TWILIO_WHATSAPP_FROM")
) {
  useSms = true;
}
if (modeRaw === "whatsapp") {
  useSms = false;
}

if (useSms) {
  if (!nonempty(env, "TWILIO_SMS_FROM")) {
    missing.push("TWILIO_SMS_FROM (required for SMS / trial mode)");
  }
} else {
  if (!nonempty(env, "TWILIO_WHATSAPP_FROM")) {
    missing.push(
      "TWILIO_WHATSAPP_FROM (required for WhatsApp), or set TWILIO_MESSAGING_MODE=sms and TWILIO_SMS_FROM",
    );
  }
}

const supabaseUrlRaw = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
if (supabaseUrlRaw && !validHttpUrl(supabaseUrlRaw)) {
  const idx = missing.indexOf("NEXT_PUBLIC_SUPABASE_URL");
  if (idx !== -1) missing.splice(idx, 1);
  missing.push(
    "NEXT_PUBLIC_SUPABASE_URL (invalid URL — use full https://…supabase.co from Supabase dashboard)",
  );
}

if (missing.length) {
  console.error("FAIL: missing or empty env keys:");
  for (const m of missing) console.error("  -", m);
  process.exit(1);
}

console.log("OK: .env.local has all required keys (values not shown).");
console.log(
  `    Twilio: ${useSms ? "SMS" : "WhatsApp"}${modeRaw ? ` (TWILIO_MESSAGING_MODE=${modeRaw})` : useSms ? " (inferred from TWILIO_SMS_FROM)" : ""}`,
);
