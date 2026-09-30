/* global document, location */

/**
 * Vercel Web Analytics for the API Reference.
 * TypeDoc copies this file into every generated page (`customJs`). Same rule as the playground and guide
 * (`playground/src/analytics.ts`): page views only, nothing on the local dev server.
 */
(() => {
  if (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = "/_vercel/insights/script.js";
  document.head.append(script);
})();
