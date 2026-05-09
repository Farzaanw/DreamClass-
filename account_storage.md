# Account Storage Plan

## Target Architecture
1. Supabase Postgres for all structured app data.
2. Supabase Storage for binary assets (files, board images, audio, video, thumbnails).
3. Supabase Realtime for live whiteboard presence and stroke/item sync.
4. Cloudflare CDN in front of Storage/public assets for speed.
5. Redis queue for async/background processing (thumbnails, transcodes, cleanup, exports).

## What To Move Off Local State
1. Whiteboard board state (items, transforms, bg, viewport, metadata).
2. Whiteboard drawing layer snapshots/blobs.
3. Concept board mappings per subject/concept.
4. Classroom design state (stickers, shelves, pets, placements).
5. Classroom materials metadata and file references.
6. User customizations (cursor, hidden tools, labels, icon packs, preferences).

## Data Model Plan (Postgres)
1. profiles: user identity plus settings.
2. subjects: per-user subject configuration.
3. concepts: concept cards per subject.
4. classroom_designs: room layout plus options per subject.
5. whiteboards: board metadata (id, user_id, subject_id, concept_id, name, timestamps).
6. whiteboard_states: current canonical JSON state (or versioned snapshots).
7. whiteboard_events (optional): append-only event log for replay/audit.
8. materials: metadata rows linked to Storage object paths.
9. media_assets: generic asset registry (type, size, mime, owner, path, hash).
10. user_preferences: UI/feature flags.
11. activity_logs (optional): important user actions.

## Storage Bucket Plan
1. user-materials/{user_id}/... PDFs, slides, videos.
2. whiteboards/{user_id}/{board_id}/... drawing snapshots/exports.
3. classrooms/{user_id}/{subject_id}/... sticker/image assets.
4. thumbnails/... generated previews.
5. Signed URLs for private access, public URLs only where intended.

## Realtime Plan
1. Channel per board: board:{board_id}.
2. Broadcast cursor/presence plus incremental ops (not full board blobs).
3. Periodic checkpoint save to Postgres (whiteboard_states).
4. Conflict strategy: last-write-wins for simple fields, op merge for board events.

## Queue/Worker Plan (Redis)
1. Generate thumbnails after upload.
2. Video transcode/compression tasks.
3. Snapshot compaction and board cleanup jobs.
4. Expired file cleanup plus orphaned asset sweeps.
5. Optional export jobs (PDF/image bundles).

## Security and Access Plan
1. Row Level Security on all user-owned tables.
2. Bucket policies scoped by auth.uid().
3. Signed URL issuance from server-side functions only.
4. Audit logging for sensitive actions (delete/share).

## Migration Plan
1. Add schema, RLS, and buckets.
2. Add data-access layer (replace local persistence calls).
3. Move whiteboard autosave to Postgres checkpoints plus Realtime ops.
4. Move media to Storage and store paths only in DB.
5. Backfill existing local data for current users.
6. Roll out behind feature flag and monitor memory and latency.

## Additional Account Data To Save
1. User role/permissions (teacher/admin).
2. Classroom rosters/sections (if multi-class).
3. Share/access controls for boards/materials.
4. Asset ownership plus storage quota tracking.
5. Preferences (cursor/theme/tool defaults).
6. Version history and restore points for boards.
7. Soft-delete and recovery metadata.
8. Device/session metadata (optional, for debugging/security).
9. Notification preferences.
10. Billing/subscription fields (if applicable).
