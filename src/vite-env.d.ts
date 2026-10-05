/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GHL_FORM_ID?: string;
  readonly VITE_GHL_CALENDAR_ID?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Passed tests from the run that gated this build (vite.config.ts), or null in dev without stats. */
declare const __TEST_COUNT__: number | null;
