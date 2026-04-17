-- Scholar review tokens
-- Run this in the Supabase SQL editor.

create table if not exists public.scholar_reviews (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade,
  token text not null unique,
  proposed_question text not null,
  proposed_answer text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied', 'revised')),
  scholar_name text,
  revised_answer text,
  comments text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz
);

create index if not exists scholar_reviews_token_idx
  on public.scholar_reviews (token);

create index if not exists scholar_reviews_question_id_idx
  on public.scholar_reviews (question_id);

-- Row level security: all reads/writes happen through the service role
-- (public review page hits a Next.js route that uses SUPABASE_SERVICE_ROLE_KEY).
alter table public.scholar_reviews enable row level security;
