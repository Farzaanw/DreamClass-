# Storage Verification Workflow

Use this workflow to validate every storage capability enabled in the cloud-storage refactor.

## Setup
1. Have two accounts ready: `UserA` and `UserB`.
2. Ensure buckets exist and are private: `user-materials`, `whiteboards`.
3. Ensure migration SQL was run.
4. Run app against the same Supabase project being tested.

## 1) Material Upload + Metadata Save
1. Log in as `UserA`.
2. Upload one PDF (<25MB), one slides file (<25MB), one video (<100MB).
3. Confirm each file appears in Classroom Material and opens in preview.
4. In DB (`profiles.materials`), verify each material has:
- `storagePath`
- `mimeType`
- `byteSize`
- no new base64 `content` for new uploads
5. In Storage, verify object keys start with `UserA_UID/...`.

## 2) Upload Guardrails
1. Try uploading a PDF >25MB.
2. Try uploading a video >100MB.
3. Confirm UI blocks upload with clear error.
4. Confirm no new DB metadata row/object created for failed uploads.

## 3) Whiteboard Snapshot Save
1. Log in as `UserA` in teacher flow.
2. Open concept whiteboard, add content, click Save.
3. Confirm board reload restores state.
4. In DB (`whiteboards`), verify:
- `user_id = UserA_UID`
- `data.drawingStoragePath` exists
- `drawing_data` legacy column is null for new saves
5. In Storage, verify snapshot path starts with `UserA_UID/.../snapshot.jpg`.

## 4) Whiteboard Stability + Limits
1. Rapidly switch concepts multiple times.
2. Confirm no tab crash/OOM and state remains stable.
3. Add items until near 400.
4. Confirm item cap is enforced and additional adds are blocked.

--- LOG OUT: confirm all user-specific data is stored and appears correctly on next login. ---

## 5) Cross-Account Isolation (Critical)
1. Log in as `UserB`.
2. Confirm `UserA` materials/boards are not visible in UI.
3. Attempt direct DB access to `UserA` rows (select/update/delete): must fail.
4. Attempt Storage access using `UserA` object paths: must fail.
5. Attempt upload into `UserA_UID/...` path while logged as `UserB`: must fail.

## 6) Auto-Migration Validation - Optional during early dev unless legacy users exist
1. Seed one legacy user record with:
- material `content` as data URL
- whiteboard legacy `drawing_data`
2. Log in as that user.
3. Confirm migration runs once and updates:
- `profiles.storage_schema_version = 1`
- `profiles.storage_migrated_at` populated
- assets moved to Storage with UID-prefixed paths
4. Log out/in again and confirm migration does not repeat.

## Pass/Fail Criteria
Pass only if all are true:
1. New files and snapshots save to Storage under the active user UID path.
2. DB rows are owner-scoped (`user_id` correct).
3. Cross-account DB and Storage access attempts fail.
4. Guardrails block oversized uploads and over-cap board items.
5. Migration is successful and idempotent.
