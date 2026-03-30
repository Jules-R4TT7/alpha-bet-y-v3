import { PostHog } from "posthog-node";
import * as Sentry from "@sentry/nextjs";

let posthogClient: PostHog | null = null;

function getPostHog(): PostHog | null {
  if (!process.env.POSTHOG_API_KEY || !process.env.NEXT_PUBLIC_POSTHOG_HOST) {
    return null;
  }
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 10,
      flushInterval: 5000,
    });
  }
  return posthogClient;
}

export function trackEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
): void {
  const ph = getPostHog();
  if (ph) {
    ph.capture({ distinctId: userId, event, properties });
  }
}

export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  const ph = getPostHog();
  if (ph) {
    ph.identify({ distinctId: userId, properties });
  }
  Sentry.setUser({ id: userId, ...properties });
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  Sentry.captureException(error, { extra: context });
}

export async function shutdownAnalytics(): Promise<void> {
  const ph = getPostHog();
  if (ph) {
    await ph.shutdown();
    posthogClient = null;
  }
}
