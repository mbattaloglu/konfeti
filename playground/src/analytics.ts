/**
 * Vercel Web Analytics Script.
 * Root-relative on purpose: Vercel serves it on every domain of a project with Web Analytics enabled, so views on
 * konfeti.mbattaloglu.com count in the konfeti project and views through mbattaloglu.com/tools/konfeti in the
 * main site's project.
 */
const ANALYTICS_SCRIPT = "/_vercel/insights/script.js";

/**
 * Hosts of the Local Dev Server, where Nothing Is Tracked.
 */
const LOCAL_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Start Vercel Web Analytics (page views only, no cookies).
 * Skipped on the local dev server. The API reference pages load the same script through TypeDoc's `customJs`
 * (`packages/konfeti/typedoc/analytics.js`).
 */
export function startAnalytics(): void {
  if (LOCAL_HOSTS.has(location.hostname)) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = ANALYTICS_SCRIPT;
  document.head.append(script);
}
