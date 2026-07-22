import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",

  // PII scrubbing: never send participant data to Sentry
  beforeSend(event) {
    // Remove any potential PII from breadcrumbs and contexts
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((b) => {
        if (b.data) {
          const clean = { ...b.data };
          delete clean.email;
          delete clean.name;
          delete clean.display_name;
          delete clean.participant;
          b.data = clean;
        }
        return b;
      });
    }
    if (event.user) {
      delete event.user.email;
      delete event.user.name;
      delete event.user.ip_address;
    }
    // Never send survey free text or form data
    if (event.request?.data) {
      delete event.request.data;
    }
    return event;
  },

  // Performance monitoring
  tracesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === "production" ? 0.1 : 1.0,

  // Don't send in development unless explicitly enabled
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
