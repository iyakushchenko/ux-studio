/// <reference types="vite/client" />

/** Injected from package.json via vite/vitest `define` (fallback for studioRelease). */
declare const __STUDIO_PACKAGE_VERSION__: string;

declare module "*.json" {
  const value: {
    name?: string;
    version?: string;
    [key: string]: unknown;
  };
  export default value;
}
