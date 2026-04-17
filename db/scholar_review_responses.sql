-- Scholar review responses
-- Run this after db/scholar_reviews.sql has already been applied.
-- It converts scholar_reviews from "one row per scholar submission" to
-- "one row per review request, with many responses in a child table".

alter table public.scholar_reviews
  drop constraint if exists scholar_reviews_status_check;

alter table public.scholar_reviews
  drop column if exists status,
  drop column if exists scholar_name,
  drop column if exists revised_answer,
  drop column if exists comments,
  drop column if exists responded_at;

create table if not exists public.scholar_review_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.scholar_reviews(id) on delete cascade,
  decision text not null
    check (decision in ('approved', 'denied', 'revised')),
  scholar_name text not null,
  revised_answer text,
  comments text,
  responded_at timestamptz not null default now()
);

create index if not exists scholar_review_responses_request_id_idx
  on public.scholar_review_responses (request_id);

alter table public.scholar_review_responses enable row level security;
