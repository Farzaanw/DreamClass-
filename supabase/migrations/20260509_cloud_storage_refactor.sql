-- Cloud-only storage refactor (single-device, latest-only)
-- Run in Supabase SQL editor.

alter table if exists public.profiles
  add column if not exists storage_migrated_at timestamptz,
  add column if not exists storage_schema_version integer default 0;

-- Optional: normalized material metadata table for future use.
create table if not exists public.material_assets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  name text not null,
  file_type text not null,
  storage_path text not null,
  mime_type text,
  byte_size bigint,
  thumbnail_url text,
  created_at timestamptz default now()
);

alter table public.material_assets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'material_assets' and policyname = 'material_assets_owner_access'
  ) then
    create policy material_assets_owner_access
      on public.material_assets
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Recommended private storage buckets (create in Supabase dashboard):
-- 1) user-materials
-- 2) whiteboards
-- Apply bucket policies to enforce path prefix by auth.uid().
