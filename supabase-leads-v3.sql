-- Run this in the Supabase SQL editor after supabase-leads-v2.sql.
-- Stores the spec reference (PB-XXXXXX) that the scoping chat shows the
-- prospect. Without it, someone quoting their reference could not be found.

alter table public.leads
  add column if not exists spec_id text;

-- Lookup by quoted reference is the only reason this column exists.
create index if not exists leads_spec_id_idx on public.leads (spec_id);
