// shortcut: lightweight telemetry shim to allow offline/local builds without external analytics packages, upgrade when vendor analytics are provisioned
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const posthogKey = import.meta.env.VITE_POSTHOG_KEY;

export function capturePageView(page: string) {
  if (posthogKey) {
    console.debug("[telemetry] pageview", page);
  }
}

export function captureEvent(
  event: string,
  properties?: Record<string, string | number | boolean>,
) {
  if (posthogKey) {
    console.debug("[telemetry] event", event, properties);
  }
}

export function captureException(error: unknown) {
  if (sentryDsn) {
    console.error("[telemetry] exception", error);
  }
}

export const Sentry = {
  captureException,
};
