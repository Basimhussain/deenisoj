-- Categories table: admin-managed list of fatwa categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table categories enable row level security;

-- Anyone can read categories (used in dropdowns)
create policy "Public read access" on categories
  for select using (true);

-- Only admins can modify categories
create policy "Admin insert" on categories
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin update" on categories
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin delete" on categories
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
