import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
      beforeSend(event) {
        if (event.user) {
          delete event.user.email;
          delete event.user.name;
          delete event.user.ip_address;
        }
        if (event.request?.data) {
          delete event.request.data;
        }
        return event;
      },
      tracesSampleRate:
        process.env.NEXT_PUBLIC_APP_ENV === "production" ? 0.1 : 1.0,
      enabled: !!process.env.SENTRY_DSN,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
      beforeSend(event) {
        if (event.user) {
          delete event.user.email;
          delete event.user.name;
          delete event.user.ip_address;
        }
        return event;
      },
      tracesSampleRate:
        process.env.NEXT_PUBLIC_APP_ENV === "production" ? 0.1 : 1.0,
      enabled: !!process.env.SENTRY_DSN,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
