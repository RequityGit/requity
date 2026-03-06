import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5c12dd273f8707c4dedd099dcbe54b6b@o4510980233887744.ingest.us.sentry.io/4510980251451392",

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay is only available in the client
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],
});
