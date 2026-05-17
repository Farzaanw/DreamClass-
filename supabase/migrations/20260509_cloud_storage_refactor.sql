-- Cloud-only storage refactor (single-device, latest-only)
-- Run in Supabase SQL editor.

alter table if exists public.profiles
  add column if not exists materials jsonb default '[]'::jsonb,
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

-- Backfill material_assets from legacy profiles.materials
insert into public.material_assets (
  id,
  user_id,
  subject_id,
  name,
  file_type,
  storage_path,
  mime_type,
  byte_size,
  thumbnail_url
)
select
  material->>'id' as id,
  profiles.id as user_id,
  material->>'subjectId' as subject_id,
  material->>'name' as name,
  material->>'type' as file_type,
  material->>'storagePath' as storage_path,
  nullif(material->>'mimeType', '') as mime_type,
  nullif(material->>'byteSize', '')::bigint as byte_size,
  nullif(material->>'thumbnailUrl', '') as thumbnail_url
from public.profiles as profiles
cross join lateral jsonb_array_elements(coalesce(profiles.materials, '[]'::jsonb)) as material
where material ? 'storagePath'
  and material->>'storagePath' <> ''
on conflict (id) do nothing;

-- Convenience view: show username alongside user_id
create or replace view public.material_assets_with_user as
select
  ma.*,
  p.username as user_name
from public.material_assets as ma
left join public.profiles as p
  on p.id = ma.user_id;

-- Convenience views for other user_id tables
do $$
begin
  if to_regclass('public.subjects') is not null then
    execute 'create or replace view public.subjects_with_user as '
      || 'select s.*, p.username as user_name '
      || 'from public.subjects as s '
      || 'left join public.profiles as p on p.id = s.user_id';
  end if;

  if to_regclass('public.classroom_designs') is not null then
    execute 'create or replace view public.classroom_designs_with_user as '
      || 'select d.*, p.username as user_name '
      || 'from public.classroom_designs as d '
      || 'left join public.profiles as p on p.id = d.user_id';
  end if;

  if to_regclass('public.whiteboards') is not null then
    execute 'create or replace view public.whiteboards_with_user as '
      || 'select w.*, p.username as user_name '
      || 'from public.whiteboards as w '
      || 'left join public.profiles as p on p.id = w.user_id';
  end if;
end $$;

-- Per-user overview for admin-style browsing
do $$
declare
  last_whiteboard_expr text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'whiteboards' and column_name = 'updated_at'
  ) then
    last_whiteboard_expr := 'max(w.updated_at)';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'whiteboards' and column_name = 'created_at'
  ) then
    last_whiteboard_expr := 'max(w.created_at)';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'whiteboards' and column_name = 'timestamp'
  ) then
    last_whiteboard_expr := 'max(w.timestamp)';
  else
    last_whiteboard_expr := 'null';
  end if;

  execute
    'create or replace view public.user_account_overview as '
    || 'select '
    || 'p.id as user_id, '
    || 'p.username, '
    || 'p.email, '
    || 'u.created_at, '
    || 'p.storage_schema_version, '
    || 'p.storage_migrated_at, '
    || '(select count(*) from public.material_assets ma where ma.user_id = p.id) as material_count, '
    || '(select count(*) from public.subjects s where s.user_id = p.id) as subject_count, '
    || '(select count(*) from public.classroom_designs d where d.user_id = p.id) as classroom_design_count, '
    || '(select count(*) from public.whiteboards w where w.user_id = p.id) as whiteboard_count, '
    || '(select max(created_at) from public.material_assets ma where ma.user_id = p.id) as last_material_at, '
    || '(select max(created_at) from public.subjects s where s.user_id = p.id) as last_subject_at, '
    || '(select max(created_at) from public.classroom_designs d where d.user_id = p.id) as last_design_at, '
    || '(select ' || last_whiteboard_expr || ' from public.whiteboards w where w.user_id = p.id) as last_whiteboard_at '
    || 'from public.profiles p '
    || 'left join auth.users u on u.id = p.id';
end $$;

-- Recommended private storage buckets (create in Supabase dashboard):
-- 1) user-materials
-- 2) whiteboards
-- Apply bucket policies to enforce path prefix by auth.uid().
