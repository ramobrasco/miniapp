-- Run this in Supabase SQL editor to create tables.
-- If you already ran an older version, run only the "votes" table block and new RLS policies.

-- Questions: offchain.
create table if not exists public.questions (
  id bigint generated always as identity primary key,
  creator_address text not null,
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- Votes: offchain, one per wallet per question. choice: 0=Yes, 1=No, 2=Wait, 3=Depends.
create table if not exists public.votes (
  question_id bigint not null references public.questions(id) on delete cascade,
  voter_address text not null,
  choice smallint not null check (choice >= 0 and choice <= 3),
  created_at timestamptz not null default now(),
  primary key (question_id, voter_address)
);

-- Optional: cache vote results for fast reads (updated when vote is cast).
create table if not exists public.vote_results (
  question_id bigint primary key references public.questions(id) on delete cascade,
  yes_count int not null default 0,
  no_count int not null default 0,
  wait_count int not null default 0,
  depends_count int not null default 0,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.questions enable row level security;
alter table public.votes enable row level security;
alter table public.vote_results enable row level security;

create policy "Questions are readable by everyone"
  on public.questions for select using (true);

create policy "Questions insert by authenticated (creator_address set by backend)"
  on public.questions for insert with check (true);

create policy "Votes readable by everyone"
  on public.votes for select using (true);

create policy "Votes insert by authenticated"
  on public.votes for insert with check (true);

create policy "Votes update by authenticated"
  on public.votes for update using (true);

create policy "Vote results readable by everyone"
  on public.vote_results for select using (true);

create policy "Vote results upsert by service"
  on public.vote_results for all using (true);

-- Storage bucket for question images (create in Supabase dashboard or via API).
-- Bucket: question-images, public read, authenticated upload.
