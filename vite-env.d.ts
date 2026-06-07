/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// --- Minimal ambient shims so JSX/TSX compiles without @types/react ---
// Permissive IntrinsicElements (any HTML/SVG tag) so existing code that
// uses <div>, <button>, <svg>, etc. is not flagged as 'implicitly any'.
// Add specific element typings here only if you want stricter checking.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

declare module 'react/jsx-dev-runtime' {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}
export {};
