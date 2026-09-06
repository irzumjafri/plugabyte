-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

create table public.leads (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now() not null,
  name        text,
  email       text,
  phone       text,
  summary     text,
  conversation jsonb      default '[]'::jsonb
);

-- Enable Row Level Security
alter table public.leads enable row level security;

-- Allow inserts via service role key (used by the API route)
create policy "Service role can insert leads"
  on public.leads
  for insert
  to service_role
  with check (true);

-- Optional: let you read leads from the dashboard
create policy "Service role can read leads"
  on public.leads
  for select
  to service_role
  using (true);
