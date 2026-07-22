"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-red-600">
            Something went wrong
          </h1>
          <p className="mt-4 opacity-70">
            An unexpected error occurred. The team has been notified.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
