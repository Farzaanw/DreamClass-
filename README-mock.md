# Teachly (DreamClass) Codebase Review Summary

## Project Overview
Teachly is a **React + TypeScript + Vite** application for elementary teachers to design digital classrooms, manage subjects (Phonics, Math, Science), and run interactive lessons. It uses **Supabase** for auth, Postgres database, and cloud storage.

## Architecture

### Core Stack
- **Frontend**: React 19, TypeScript 5.8, Vite 6
- **UI/Styling**: Tailwind CSS (CDN), Motion (framer-motion v12), Lucide React icons
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Font**: Fredoka (custom, friendly appearance)
- **AI**: Google Gemini SDK (`@google/genai`)

### Project Structure
```
├── App.tsx              # Root component with all routing & state management (~1550 lines)
├── types.ts             # All TypeScript interfaces
├── constants.tsx        # Subjects, themes, stickers, mascots, music
├── index.tsx            # Entry point
├── index.html           # HTML shell
├── components/
│   ├── Auth.tsx         # Login/Signup flows
│   ├── Dashboard.tsx    # Teacher dashboard (subjects, materials, songs, games)
│   ├── ConceptDashboard.tsx  # Per-concept whiteboard/lesson view
│   ├── ClassroomDesigner.tsx  # Classroom customization UI
│   ├── ClassroomView.tsx     # Live student-facing classroom
│   ├── CalendarOverlay.tsx   # Calendar component
│   ├── PublicLibrary.tsx     # Curated resource browser
│   └── StaticPages.tsx       # Static pages
├── lib/
│   ├── supabase.ts      # Supabase client init
│   └── storage.ts       # File upload, signed URLs, migration utilities
├── supabase/migrations/ # DB migration SQL files
└── public/sounds/       # Audio files
```

### Key Data Types (`types.ts`)
- **User**: Central model with custom subjects, classroom designs, progress, materials, songs, games, calendar data
- **Subject**: Has id, title, color, icon, concepts array
- **Concept**: id, title, icon, description, suggested items
- **ClassroomDesign**: wall/floor colors, mascot, posters, whiteboards, concept boards
- **Whiteboard**: Items, background type, drawing data (supports cloud storage paths vs legacy inline data URIs)
- **MaterialFile**: Supports PDF, slides, video with cloud storage integration

### State Management
- **App.tsx** is a massive single-file state manager using React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`)
- View routing via `currentView` state (11 views: landing, auth, mode-selection, dashboard, designer-select, designer, classroom, concept, public-library)
- Auth state tied to Supabase session with a `fetchUserData` function that self-heals missing profiles
- Data flows: user → subjects → concepts → classroom designs → whiteboards/materials

### Notable Implementation Details

1. **Authentication**: Supabase Auth with password recovery, self-healing profiles (creates profile if missing on fetch)
2. **Storage Migration**: `migrateLegacyStorageData` function converts inline base64 data URIs to Supabase Storage (buckets: `user-materials`, `whiteboards`), tracks schema version
3. **Cursor Customization**: Custom cursor with trails (rainbow, sparkle, bubble, etc.), styles (arrow, pencil, star, crosshair), animations (pulse, glow)
4. **Classroom Designer**: Wall/floor colors and patterns, mascots (10 options), shelf objects, ambient music
5. **Whiteboard System**: Supports concept-specific boards, drawing snapshots stored in Supabase Storage with signed URLs
6. **Public Library**: Resource browser where teachers can add curated resources to their subjects

### Database Schema (from code references)
- `profiles` table: user preferences, materials, songs, games, calendar data, storage migration status
- `subjects` table: custom subjects per user
- `classroom_designs` table: design_data JSON per user+subject
- `whiteboards` table: whiteboard states per user+subject+concept

### What's Working Well
- Comprehensive Supabase integration with self-healing data fetch
- Legacy data migration path from inline base64 to cloud storage
- Clean type definitions with backward-compatible fields (e.g., `drawingData` vs `drawingStoragePath`)
- Playful, kid-friendly UI with extensive customization options

### Areas That Could Benefit From Refactoring
- **App.tsx is very large** (~1550 lines) — consider splitting into a custom hook or context provider for shared state
- Error handling is mostly `console.error` with silent fallbacks
- No loading states for async operations (e.g., `fetchUserData` has no loading indicator)
- No unit tests detected