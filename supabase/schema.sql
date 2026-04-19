-- leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  phone text not null,
  email text,
  source text default 'demo',
  concern text,
  language_preference text default 'hi-IN',
  detected_language text,
  no_followup boolean default false,
  status text default 'new',
  clinic_id uuid not null default '00000000-0000-0000-0000-000000000001'
);

-- calls
create table calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  vapi_call_id text unique,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  outcome text,
  transcript jsonb,
  summary text,
  respect_score int,
  language_used text,
  created_at timestamptz default now(),
  clinic_id uuid not null default '00000000-0000-0000-0000-000000000001'
);

-- bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  call_id uuid references calls(id),
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  google_event_id text,
  whatsapp_sent boolean default false,
  created_at timestamptz default now(),
  clinic_id uuid not null default '00000000-0000-0000-0000-000000000001'
);

-- followup_suppressions
-- CRITICAL: any lead_id here must NEVER receive automated callbacks
create table followup_suppressions (
  lead_id uuid primary key references leads(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);
