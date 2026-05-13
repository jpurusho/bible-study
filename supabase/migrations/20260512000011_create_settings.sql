create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.update_updated_at();

alter table public.app_settings enable row level security;

create policy "Anyone can read settings"
  on public.app_settings for select
  using (true);

create policy "Admins can manage settings"
  on public.app_settings for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Seed default settings
insert into public.app_settings (key, value) values
  ('default_theme', '{"mode": "system", "fontSize": 16, "fontFamily": "default"}'),
  ('esv_api_key', '""');
