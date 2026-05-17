# Supabase Database Summary

Goal
- Keep file bytes in Storage, keep metadata in Postgres.

Rule of thumb
- Postgres tables store metadata and pointers; Storage buckets store the actual file bytes.

Main database components (what they are for)
- `public.profiles`
  - `materials` (jsonb): legacy material metadata list (current app reads/writes here).
  - `storage_schema_version`, `storage_migrated_at`: migration tracking.
- `public.material_assets`
  - Normalized per-material metadata (id, user_id, subject_id, storage_path, mime_type, byte_size, thumbnail_url).
  - RLS: owner-only access (`auth.uid() = user_id`).
- `public.whiteboards`
  - `data.drawingStoragePath`: points to latest snapshot in Storage.
  - `drawing_data`: legacy base64 data; should be null for new saves.

Storage buckets
- `user-materials`: material files at {user_id}/{material_id}/{fileName}
- `whiteboards`: snapshots at {user_id}/{subject_id}/{board_id}/snapshot.jpg

Migration (20260509_cloud_storage_refactor.sql)
- Adds `profiles.materials`, `profiles.storage_schema_version`, `profiles.storage_migrated_at`.
- Creates `public.material_assets` + RLS policy.
