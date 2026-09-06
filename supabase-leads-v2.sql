-- Run this in the Supabase SQL editor after supabase-leads.sql.
-- Extends `leads` with the structured scoping-chat output (build type, answers, effort band).

alter table public.leads
  add column if not exists build_type text,
  add column if not exists answers jsonb default '{}'::jsonb,
  add column if not exists effort_low int,
  add column if not exists effort_high int,
  add column if not exists disqualified_reason text,
  add column if not exists channel text default 'web',
  add column if not exists session_id uuid;
