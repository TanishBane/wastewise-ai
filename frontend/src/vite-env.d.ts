/// <reference types="vite/client" />

declare module "*.css" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Local declarations keep type-checking available before optional SDK packages are installed.
declare module "posthog-js" {
  const posthog: {
    init: (key: string, options?: Record<string, unknown>) => void;
    capture: (event: string, properties?: Record<string, unknown>) => void;
  };
  export default posthog;
}

declare module "@sentry/react" {
  export function init(options?: Record<string, unknown>): void;
  export function browserTracingIntegration(): unknown;
  export function captureException(error: unknown): void;
}
