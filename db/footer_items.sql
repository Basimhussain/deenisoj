-- Footer items table: admin-managed footer links/content
create table if not exists footer_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text,
  section text not null default 'links',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table footer_items enable row level security;

-- Anyone can read footer items (rendered on every page)
create policy "Public read access" on footer_items
  for select using (true);

-- Only admins can modify footer items
create policy "Admin insert" on footer_items
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin update" on footer_items
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin delete" on footer_items
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
