/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ALPHA_VANTAGE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}