# UI Design Summary

Main components
- `App.tsx`: root app + view routing, shared state and cursor features.
- `Auth.tsx`: login/signup flows.
- `Dashboard.tsx`: teacher dashboard, subject/materials management.
- `ClassroomDesigner.tsx`: classroom customization UI (walls, floors, mascots).
- `ClassroomView.tsx`: runtime classroom view for students.
- `ConceptDashboard.tsx`: focused concept/materials view.
- `PublicLibrary.tsx`: resource browser and assignment.
- `CalendarOverlay.tsx` / `StaticPages.tsx`: small overlays and static content.

Styling & design choices
- Utility-first classes (Tailwind-like `text-...`, `bg-...`, `rounded-...`, `flex`, `shadow`, etc.).
- Playful, kid-friendly visual language: rounded cards, large emojis, bright/pastel palette (see `constants.tsx`).
- Depth & polish via shadows, border-bottom accents, large border radii, and soft gradients.
- Motion and interactivity: `motion/react` for animations, cursor trails/particles, hover/transform effects.
- Iconography: a mix of emoji stickers and `lucide-react` icons for clarity and fun.
- Theming tokens centralized in `constants.tsx` (colors, stickers, mascots, wall/floor themes).
- Mix of utility classes and inline style objects for specific elements (particle sizes, SVGs).

Notes & quick recommendations
- Project uses many Tailwind-style classes but `tailwindcss` is not listed in `package.json` — confirm build pipeline or replace with a utility CSS.
- Accessibility: ensure sufficient color contrast, keyboard focus styles, and aria labels for interactive controls and emojis.
- Consistency: central tokens in `constants.tsx` are good; consider a small design token file or CSS variables for runtime theming.

Created: ui_design.md
