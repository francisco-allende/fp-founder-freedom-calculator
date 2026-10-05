/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GHL_FORM_ID?: string;
  readonly VITE_GHL_CALENDAR_ID?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
