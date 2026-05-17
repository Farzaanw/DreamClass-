# Teachly (DreamClass)

Teachly is a playful, classroom-first platform for elementary teachers to design classrooms, manage subjects, and run engaging lessons with interactive whiteboards, materials, songs, and games.

## Who It Is For
- Elementary teachers and classroom facilitators.
- Schools piloting interactive, visual-first lesson tools.

## What It Does
- Provides a teacher dashboard for subjects, materials, songs, and games.
- Offers an interactive classroom view and whiteboard with saved states.
- Supports classroom design (walls, floors, mascots, decor).
- Includes a public library to add curated resources.

## Features
- Teacher dashboard with subject management.
- Classroom designer and live classroom view.
- Whiteboard snapshots with Storage-backed images.
- Materials upload (PDF, slides, video) with previews.
- Songs and games catalog for classroom use.
- Auth and profile persistence with Supabase.

## Tech Stack
- React + TypeScript
- Vite
- Supabase (Auth, Postgres, Storage)
- Motion (animation), Lucide icons

## Project Structure (High-Level)
- App entry: `App.tsx`
- UI components: `components/`
- Constants and types: `constants.tsx`, `types.ts`
- Supabase clients/utilities: `lib/`
- DB migrations: `supabase/migrations/`

## Run Locally

Prerequisites: Node.js

```bash
npm install
```

Set required environment variables in `.env.local` (see `.env` for reference).

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Notes
- Storage buckets expected: `user-materials`, `whiteboards`.
- See `supbase.md` for data layout and migration details.
