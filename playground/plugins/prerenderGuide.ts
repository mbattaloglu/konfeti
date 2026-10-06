import type { Plugin } from "vite";

import { PRERENDERED_LOCALE, renderGuide } from "../src/docs/guideRenderer.ts";
import { translate } from "../src/i18n/messages.ts";
import { GUIDE_MD, REPO_URL, SITE_URL } from "../src/site/siteUrls.ts";
import { readPackageInfo } from "./siteInfo.ts";
import type { PackageInfo } from "./siteInfo.ts";

/**
 * Put Markup in Place of a `<!--prerender:name-->` Marker.
 *
 * @param html - Page HTML
 * @param marker - Marker Name
 * @param markup - Markup to Insert
 * @returns Page HTML
 */
function fill(html: string, marker: string, markup: string): string {
  const comment = `<!--prerender:${marker}-->`;

  if (!html.includes(comment)) {
    throw new Error(`konfeti site: ${comment} is missing from docs/index.html`);
  }

  // a replacer function, so `$` in code samples is not read as a replacement pattern
  return html.replace(comment, () => markup);
}

/**
 * Build schema.org Description of the Library (JSON-LD for search engines and LLM crawlers).
 *
 * @param info - Package Facts
 * @returns Structured Data
 */
function structuredData(info: PackageInfo): Record<string, string> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "konfeti",
    description: info.description,
    url: `${SITE_URL}docs/`,
    codeRepository: REPO_URL,
    programmingLanguage: "TypeScript",
    runtimePlatform: "Web browser",
    license: "https://opensource.org/licenses/MIT",
    version: info.version,
  };
}

/**
 * Bake the English Guide into the Built Docs Page.
 * Readers without JavaScript (LLM fetchers, crawlers) otherwise get an empty page; the browser keeps this markup
 * for English and renders other languages over it.
 *
 * @param packageDir - Library Package Folder (README and package.json)
 * @returns Vite Plugin
 */
export function prerenderGuide(packageDir: string): Plugin {
  return {
    name: "konfeti:prerender-guide",
    apply: "build",
    transformIndexHtml(html, context) {
      if (!context.path.endsWith("docs/index.html")) {
        return html;
      }

      const info = readPackageInfo(packageDir);
      const guide = renderGuide(info.readme, {
        run: translate(PRERENDERED_LOCALE, "docs.run"),
        copy: translate(PRERENDERED_LOCALE, "docs.copy"),
      });
      let page = fill(html, "guide", guide.content);
      page = fill(page, "toc", guide.toc);
      page = fill(page, "version", `v${info.version}`);

      return {
        html: page,
        tags: [
          {
            tag: "link",
            attrs: { rel: "alternate", type: "text/markdown", href: SITE_URL + GUIDE_MD },
            injectTo: "head",
          },
          {
            tag: "script",
            attrs: { type: "application/ld+json" },
            children: JSON.stringify(structuredData(info)),
            injectTo: "head",
          },
        ],
      };
    },
  };
}
