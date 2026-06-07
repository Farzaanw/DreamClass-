// Ambient shim: silences "Could not find a declaration file for module
// 'react/jsx-runtime'" when @types/react is not installed.
// This is a NON-INVASIVE fix that doesn't change any existing source file.

declare module 'react/jsx-runtime' {
  import * as React from 'react';
  export const Fragment: React.ElementType;
  export function jsx(
    type: React.ElementType,
    props?: { [key: string]: any } & { children?: any },
    key?: string | number | null
  ): React.ReactElement;
  export function jsxs(
    type: React.ElementType,
    props?: { [key: string]: any } & { children?: any },
    key?: string | number | null
  ): React.ReactElement;
}

declare module 'react/jsx-dev-runtime' {
  import * as React from 'react';
  export const Fragment: React.ElementType;
  export function jsx(
    type: React.ElementType,
    props?: { [key: string]: any } & { children?: any },
    key?: string | number | null
  ): React.ReactElement;
  export function jsxs(
    type: React.ElementType,
    props?: { [key: string]: any } & { children?: any },
    key?: string | number | null
  ): React.ReactElement;
}
