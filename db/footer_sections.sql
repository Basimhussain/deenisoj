-- Footer sections table: admin-managed groupings for footer items
create table if not exists footer_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table footer_sections enable row level security;

-- Anyone can read footer sections (rendered on every page)
create policy "Public read access" on footer_sections
  for select using (true);

-- Only admins can modify footer sections
create policy "Admin insert" on footer_sections
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin update" on footer_sections
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin delete" on footer_sections
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
