import type { Plugin } from "vite";

import { SITE_URL } from "./siteInfo.ts";

/**
 * Site Pages Listed in the Sitemap, Relative to the Site URL (TypeDoc writes its own for the API reference).
 */
const SITEMAP_PAGES = ["", "docs/"] as const;

/**
 * Build robots.txt: everything is open, and both sitemaps are listed.
 *
 * @returns File Text
 */
function robotsTxt(): string {
  return [
    "# konfeti: every page is open to search engines and AI crawlers",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${SITE_URL}sitemap.xml`,
    `Sitemap: ${SITE_URL}docs/api/sitemap.xml`,
    "",
  ].join("\n");
}

/**
 * Build sitemap.xml for the Playground and the Guide.
 *
 * @returns File Text
 */
function sitemapXml(): string {
  const urls = SITEMAP_PAGES.map((page) => `  <url><loc>${SITE_URL}${page}</loc></url>`);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/**
 * Emit robots.txt and sitemap.xml at the Site Root.
 *
 * @returns Vite Plugin
 */
export function crawlerFiles(): Plugin {
  return {
    name: "konfeti:crawler-files",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robotsTxt() });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml() });
    },
  };
}
