-- Align existing projects with lib/constants DEFAULT_CLINIC_ID and app inserts.
-- Run once in Supabase → SQL Editor if you see PGRST204 / missing clinic_id.

alter table public.leads
  add column if not exists clinic_id uuid not null default '00000000-0000-0000-0000-000000000001';

alter table public.calls
  add column if not exists clinic_id uuid not null default '00000000-0000-0000-0000-000000000001';

alter table public.bookings
  add column if not exists clinic_id uuid not null default '00000000-0000-0000-0000-000000000001';
