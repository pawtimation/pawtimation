const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;

export function trackEvent(eventName, properties = {}) {
  if (!POSTHOG_KEY) {
    if (import.meta.env.DEV) {
      console.log('[Metrics]', eventName, properties);
    }
    return;
  }

  // Future: integrate with PostHog or analytics provider
  // posthog.capture(eventName, properties);
}
