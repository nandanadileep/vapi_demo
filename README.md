# xyz_clinic Voice Intake

Multilingual AI voice intake and consultation booking platform for dermatology and skin/hair clinics.

Built with Next.js App Router, Supabase, Vapi, Sarvam TTS, Deepgram transcription, and provider-side tools (Google Calendar + Twilio).

## Product Preview

![xyz_clinic intake screen](public/images/intake-preview.png)

### Dashboard Preview

![xyz_clinic dashboard](public/images/dashboard-preview.png)

## What This Project Does

- Public intake form (`/`) for patient name, phone, concern, and preferred language.
- Creates leads in Supabase.
- Supports two call modes:
  - `phone`: triggers outbound Vapi phone call.
  - `web`: starts in-browser voice test call (no PSTN dependency).
- Handles multilingual conversation flow with language-specific prompting and voice settings.
- Supports function-based actions from calls:
  - check slot availability
  - book consultation
  - send WhatsApp info
  - schedule callback
- Dashboard (`/dashboard`) for lead pipeline and call transcript review.

## Core Architecture

- **Frontend**: Next.js + React + Tailwind
- **Backend APIs**: Next.js route handlers in `app/api/*`
- **Database**: Supabase (`leads`, `calls`, `bookings`, `followup_suppressions`)
- **Voice Orchestration**: Vapi
- **LLM**:
  - Phone flow: Anthropic model
  - Web test flow: OpenAI model override
- **STT**: Deepgram
- **TTS**: Sarvam bridge (`/api/sarvam/tts`) with per-language speaker/pace support
- **Integrations**:
  - Google Calendar for booking events
  - Twilio for SMS/WhatsApp notifications

## Key Flows

### 1) Intake -> Lead Creation

1. User submits form on `/`.
2. `POST /api/leads` validates payload.
3. Lead is inserted in Supabase.
4. Depending on mode:
   - `CALL_MODE=phone`: starts Vapi outbound phone call.
   - `CALL_MODE=web`: returns confirmation and enables browser `Test` call.

### 2) Phone Call Mode

- `lib/vapi.ts` sends Vapi call request with prompt, tools, transcriber, and voice config.
- Vapi webhooks are processed by `app/api/vapi/webhook/route.ts`.
- Call lifecycle + transcript + analysis are persisted in `calls`.

### 3) Web Call Mode

- Browser starts call via `@vapi-ai/web`.
- Web call events are persisted through `POST /api/web-calls/events`.
- This enables dashboard call links/transcripts for web test sessions.

### 4) Tool Calls During Conversation

- `check_availability` -> Google Calendar availability
- `book_consultation` -> booking row + calendar event + confirmation message
- `send_whatsapp_info` -> Twilio + optional suppression
- `schedule_callback` -> callback message with suppression checks

## Project Structure

- `app/page.tsx` - public intake page
- `components/LeadForm.tsx` - form UI + web call controls
- `app/dashboard/*` - owner dashboard + call detail
- `app/api/leads/route.ts` - lead intake endpoint
- `app/api/vapi/*` - Vapi webhooks + function routes
- `app/api/sarvam/tts/route.ts` - TTS bridge
- `app/api/web-calls/events/route.ts` - web call persistence events
- `lib/prompts/*` - prompt templates and assembly
- `lib/lead-intake.ts` - lead creation + call trigger logic
- `lib/vapi-function-services.ts` - function-call business actions
- `lib/dashboard-metrics.ts` - dashboard queries

## Setup

### Prerequisites

- Node.js 18+
- npm
- Supabase project + credentials
- Vapi account + phone/web credentials
- Sarvam API key
- (Optional) Twilio + Google Calendar if testing booking/notification actions

### Install

```bash
npm install
```

### Environment

Copy and fill:

```bash
cp .env.local.example .env.local
```

At minimum for local intake + web testing:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VAPI_API_KEY`
- `VAPI_PHONE_NUMBER_ID` (for phone mode)
- `SARVAM_API_KEY`
- `CLINIC_NAME`
- `CLINIC_CITY`
- `CLINIC_PHONE`
- `NEXT_PUBLIC_BASE_URL`
- `CALL_MODE=web` (or `phone`)
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID`

Optional web tuning:

- `NEXT_PUBLIC_VAPI_WEB_VOICE_ID`
- `NEXT_PUBLIC_VAPI_WEB_VOICE_MODEL`
- `NEXT_PUBLIC_VAPI_WEB_TRANSCRIBER_MODEL_EN`
- `NEXT_PUBLIC_VAPI_WEB_TRANSCRIBER_MODEL_MULTI`
- `NEXT_PUBLIC_VAPI_WEB_EOT_TIMEOUT_MS`
- `NEXT_PUBLIC_VAPI_WEB_EOT_THRESHOLD`

Optional Sarvam per-language tuning:

- `SARVAM_SPEAKER_ML_IN`, `SARVAM_PACE_ML_IN`
- `SARVAM_SPEAKER_TA_IN`, `SARVAM_PACE_TA_IN`
- `SARVAM_SPEAKER_TE_IN`, `SARVAM_PACE_TE_IN`
- `SARVAM_SPEAKER_KN_IN`, `SARVAM_PACE_KN_IN`
- `SARVAM_SPEAKER_HI_IN`, `SARVAM_PACE_HI_IN`

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Verification Commands

```bash
npm run lint
npm run build
```

## Dashboard Notes

- Pipeline rows come from `leads`.
- `Call` link appears only when a `calls` row exists.
- For web test calls, events must be persisted through `/api/web-calls/events` for transcript visibility.

## Common Troubleshooting

- **“Could not start browser call”**  
  Verify `NEXT_PUBLIC_VAPI_PUBLIC_KEY`, `NEXT_PUBLIC_VAPI_ASSISTANT_ID`, and browser mic permissions.

- **Call starts then “Meeting has ended / ejected”**  
  Usually Vapi assistant/runtime configuration issue. Validate assistant publish state and web-compatible config.

- **Lead created but no transcript in dashboard**  
  Ensure web call events are reaching `/api/web-calls/events` and `calls` rows are being written.

- **Phone call trial whisper / press key behavior**  
  Telephony trial provider behavior (external account setting), not app UI logic.

## Tech Scripts

- `npm run dev` - local development
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - lint checks
  <svg width="100%" viewBox="0 0 680 620" role="img" style="" xmlns="http://www.w3.org/2000/svg">
<title style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">EmpathyFlow HLD</title>
<desc style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">High level architecture of EmpathyFlow multilingual voice intake system for dermatology clinics</desc>
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
<mask id="imagine-text-gaps-tc2agc" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="680" height="620" fill="white"/><rect x="271.53125" y="31.234375" width="136.9375" height="21.53125" fill="black" rx="2"/><rect x="299.109375" y="109.234375" width="81.78125" height="21.53125" fill="black" rx="2"/><rect x="267.828125" y="128.484375" width="144.34375" height="19.03125" fill="black" rx="2"/><rect x="103.390625" y="221.234375" width="73.21875" height="21.515625" fill="black" rx="2"/><rect x="276.65625" y="221.234375" width="126.6875" height="21.515625" fill="black" rx="2"/><rect x="287.453125" y="309.25" width="105.09375" height="21.515625" fill="black" rx="2"/><rect x="261.28125" y="328.484375" width="157.4375" height="19.015625" fill="black" rx="2"/><rect x="296.109375" y="405.25" width="87.78125" height="21.515625" fill="black" rx="2"/><rect x="276.78125" y="424.484375" width="126.4375" height="19.015625" fill="black" rx="2"/><rect x="279.125" y="501.25" width="121.75" height="21.515625" fill="black" rx="2"/><rect x="280.15625" y="520.5" width="119.6875" height="19" fill="black" rx="2"/><rect x="485.265625" y="204.234375" width="119.46875" height="21.515625" fill="black" rx="2"/><rect x="481.546875" y="223.484375" width="126.90625" height="19.03125" fill="black" rx="2"/><rect x="521.546875" y="264.25" width="46.90625" height="21.515625" fill="black" rx="2"/><rect x="493.359375" y="283.484375" width="103.28125" height="19.015625" fill="black" rx="2"/><rect x="140.75" y="562.078125" width="118.5" height="19.015625" fill="black" rx="2"/></mask></defs>

<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="230" y="20" width="220" height="44" rx="8" stroke-width="0.5" style="fill:rgb(68, 68, 65);stroke:rgb(180, 178, 169);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="42" text-anchor="middle" dominant-baseline="central" style="fill:rgb(211, 209, 199);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Patient intake form</text>
</g>

<line x1="340" y1="64" x2="340" y2="100" marker-end="url(#arrow)" style="fill:none;stroke:rgb(156, 154, 146);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="210" y="100" width="260" height="56" rx="8" stroke-width="0.5" style="fill:rgb(60, 52, 137);stroke:rgb(175, 169, 236);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="120" text-anchor="middle" dominant-baseline="central" style="fill:rgb(206, 203, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Next.js API</text>
<text x="340" y="138" text-anchor="middle" dominant-baseline="central" style="fill:rgb(175, 169, 236);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:12px;font-weight:400;text-anchor:middle;dominant-baseline:central">create lead + trigger call</text>
</g>

<line x1="270" y1="156" x2="160" y2="210" marker-end="url(#arrow)" style="fill:none;stroke:rgb(156, 154, 146);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<line x1="340" y1="156" x2="340" y2="210" marker-end="url(#arrow)" style="fill:none;stroke:rgb(156, 154, 146);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="60" y="210" width="160" height="44" rx="8" stroke-width="0.5" style="fill:rgb(8, 80, 65);stroke:rgb(93, 202, 165);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="140" y="232" text-anchor="middle" dominant-baseline="central" style="fill:rgb(159, 225, 203);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Supabase</text>
</g>

<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="240" y="210" width="200" height="44" rx="8" stroke-width="0.5" style="fill:rgb(60, 52, 137);stroke:rgb(175, 169, 236);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="232" text-anchor="middle" dominant-baseline="central" style="fill:rgb(206, 203, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Vapi orchestrator</text>
</g>

<line x1="340" y1="254" x2="340" y2="300" marker-end="url(#arrow)" style="fill:none;stroke:rgb(156, 154, 146);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="210" y="300" width="260" height="56" rx="8" stroke-width="0.5" style="fill:rgb(8, 80, 65);stroke:rgb(93, 202, 165);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="320" text-anchor="middle" dominant-baseline="central" style="fill:rgb(159, 225, 203);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Deepgram STT</text>
<text x="340" y="338" text-anchor="middle" dominant-baseline="central" style="fill:rgb(93, 202, 165);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:12px;font-weight:400;text-anchor:middle;dominant-baseline:central">nova-2 / flux-general-multi</text>
</g>

<line x1="340" y1="356" x2="340" y2="396" marker-end="url(#arrow)" style="fill:none;stroke:rgb(156, 154, 146);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="210" y="396" width="260" height="56" rx="8" stroke-width="0.5" style="fill:rgb(99, 56, 6);stroke:rgb(239, 159, 39);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="416" text-anchor="middle" dominant-baseline="central" style="fill:rgb(250, 199, 117);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Claude LLM</text>
<text x="340" y="434" text-anchor="middle" dominant-baseline="central" style="fill:rgb(239, 159, 39);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:12px;font-weight:400;text-anchor:middle;dominant-baseline:central">reasoning + tool calls</text>
</g>

<line x1="340" y1="452" x2="340" y2="492" marker-end="url(#arrow)" style="fill:none;stroke:rgb(156, 154, 146);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="210" y="492" width="260" height="56" rx="8" stroke-width="0.5" style="fill:rgb(8, 80, 65);stroke:rgb(93, 202, 165);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="340" y="512" text-anchor="middle" dominant-baseline="central" style="fill:rgb(159, 225, 203);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Sarvam Bulbul v3</text>
<text x="340" y="530" text-anchor="middle" dominant-baseline="central" style="fill:rgb(93, 202, 165);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:12px;font-weight:400;text-anchor:middle;dominant-baseline:central">Indian language TTS</text>
</g>

<path d="M470 424 L560 424 L560 232 L460 232" fill="none" stroke="#1D9E75" stroke-width="1" marker-end="url(#arrow)" mask="url(#imagine-text-gaps-tc2agc)" style="fill:none;stroke:rgb(29, 158, 117);color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="460" y="200" width="170" height="44" rx="8" stroke-width="0.5" style="fill:rgb(8, 80, 65);stroke:rgb(93, 202, 165);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="545" y="215" text-anchor="middle" dominant-baseline="central" style="fill:rgb(159, 225, 203);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Google Calendar</text>
<text x="545" y="233" text-anchor="middle" dominant-baseline="central" style="fill:rgb(93, 202, 165);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:12px;font-weight:400;text-anchor:middle;dominant-baseline:central">availability + booking</text>
</g>

<path d="M470 440 L580 440 L580 280 L630 280" fill="none" stroke="#1D9E75" stroke-width="1" marker-end="url(#arrow)" mask="url(#imagine-text-gaps-tc2agc)" style="fill:none;stroke:rgb(29, 158, 117);color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<g style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
<rect x="460" y="260" width="170" height="44" rx="8" stroke-width="0.5" style="fill:rgb(8, 80, 65);stroke:rgb(93, 202, 165);color:rgb(255, 255, 255);stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="545" y="275" text-anchor="middle" dominant-baseline="central" style="fill:rgb(159, 225, 203);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:14px;font-weight:500;text-anchor:middle;dominant-baseline:central">Twilio</text>
<text x="545" y="293" text-anchor="middle" dominant-baseline="central" style="fill:rgb(93, 202, 165);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:12px;font-weight:400;text-anchor:middle;dominant-baseline:central">WhatsApp / SMS</text>
</g>

<path d="M340 548 L340 580 L140 580 L140 254" fill="none" stroke="#888780" stroke-width="1" stroke-dasharray="5 4" marker-end="url(#arrow)" mask="url(#imagine-text-gaps-tc2agc)" style="fill:none;stroke:rgb(136, 135, 128);color:rgb(255, 255, 255);stroke-width:1px;stroke-dasharray:5px, 4px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
<text x="200" y="576" text-anchor="middle" style="fill:rgb(194, 192, 182);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:12px;font-weight:400;text-anchor:middle;dominant-baseline:auto">webhook + analysis</text>

</svg>
<img width="680" height="620" alt="empathyflow_hld" src="https://github.com/user-attachments/assets/448cff71-1336-4042-8541-c41fa91f0311" />


## License

Private internal project (see repository policy).
