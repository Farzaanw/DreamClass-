# Teachly (DreamClass) Project Summary

## What's Being Built
Teachly is a playful, classroom-first platform designed for elementary teachers and classroom facilitators. It enables teachers to design digital classrooms, manage subjects, and run engaging lessons with interactive whiteboards, materials, songs, and games. Key features include a teacher dashboard for resource management, a visual classroom designer, a live classroom view for students, and a public library for curated educational resources. The platform relies on Supabase for backend services like authentication, database, and cloud storage.

## Styling Used
- **Tailwind CSS**: Used via CDN for rapid, utility-first styling.
- **Visual Design**: The UI follows a kid-friendly, playful design language featuring rounded cards, large emojis, bright/pastel palettes, and depth through shadows and border accents.
- **Icons**: `lucide-react` is used for iconography along with standard emojis.
- **Typography**: The custom font `Fredoka` is used for a friendly appearance.
- **Animations**: `motion/react` is utilized for animations, cursor trails, and interactive transitions.
- **Theming**: Core design tokens (colors, mascots, stickers, wall/floor themes) are centralized in `constants.tsx`.

## Progress Bullets (What's Been Done So Far)
- **App Core & Routing**: Implemented main entry point (`App.tsx`) with state management and view routing (landing, auth, dashboard, designer, classroom, concept, public library).
- **Authentication**: Built complete login/signup workflows (`Auth.tsx`) integrated with Supabase Auth.
- **Teacher Dashboard**: Created UI (`Dashboard.tsx`, `ConceptDashboard.tsx`) for managing subjects, concepts, materials, songs, and games.
- **Classroom Designer**: Developed customization interface (`ClassroomDesigner.tsx`) allowing teachers to select walls, floors, mascots, and decor.
- **Live Classroom View**: Built the runtime view (`ClassroomView.tsx`) for interactive student sessions.
- **Interactive Whiteboard**: Implemented a whiteboard system that safely backs up snapshots to Supabase Cloud Storage.
- **Public Library**: Created a resource browser (`PublicLibrary.tsx`) for teachers to assign curated materials to subjects.
- **Supabase Integration**: Fully wired up Supabase client (`lib/supabase.ts`) and cloud storage utilities (`lib/storage.ts`) for file management.
- **Database Migrations**: Successfully applied SQL migrations for transitioning from base64 legacy payloads to cloud storage artifacts (e.g., `20260509_cloud_storage_refactor.sql`, `20260516_strip_legacy_whiteboards.sql`).