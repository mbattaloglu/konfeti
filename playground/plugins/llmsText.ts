import { REPO_URL, SITE_URL } from "./siteInfo.ts";
import type { PackageInfo } from "./siteInfo.ts";

/**
 * One API Reference Page in Markdown.
 */
export type ApiPage = {
  /**
   * Module Name (`konfeti`, `konfeti/worker`).
   */
  readonly module: string;
  /**
   * Site Path of the Page, Relative to the Site URL.
   */
  readonly path: string;
  /**
   * Page Markdown.
   */
  readonly markdown: string;
};

/**
 * Site Path of the English Guide in Markdown.
 */
export const GUIDE_MD = "docs/index.md";

/**
 * Site Path of the Turkish Guide in Markdown.
 */
export const GUIDE_TR_MD = "docs/tr.md";

/**
 * Site Path of the Whole Documentation in One File.
 */
export const LLMS_FULL = "llms-full.txt";

/**
 * README Sections Left Out of the Guide Summary (navigation and legal, not features).
 */
const SUMMARY_SKIPPED = new Set(["Contents", "License"]);

/**
 * README Links that Point to a README, Mapped to Its Markdown Page on the Site.
 */
const README_PAGES: Readonly<Record<string, string>> = {
  "./README.md": GUIDE_MD,
  "./README.tr.md": GUIDE_TR_MD,
};

/**
 * Resolve README Link Relative to the Package Folder to an Absolute URL.
 *
 * @param href - Relative Link (`./…` or `../../…`)
 * @returns Absolute URL
 */
function absoluteHref(href: string): string {
  const page = README_PAGES[href];

  if (page !== undefined) {
    return SITE_URL + page;
  }

  return href.startsWith("../../")
    ? `${REPO_URL}/blob/main/${href.slice("../../".length)}`
    : `${REPO_URL}/blob/main/packages/konfeti/${href.replace(/^\.\//, "")}`;
}

/**
 * Turn README into the Guide's Markdown Page.
 * Relative links become absolute (the page is read away from the repository) and the site-only `run` flag
 * leaves the code fences.
 *
 * @param markdown - README Source
 * @returns Page Markdown
 */
export function siteMarkdown(markdown: string): string {
  return markdown
    .replace(/\]\((\.{1,2}\/[^)\s]*)\)/g, (_match, href: string) => `](${absoluteHref(href)})`)
    .replace(/^(```\w+) run$/gm, "$1");
}

/**
 * List README Feature Sections (H2 headings without backticks).
 *
 * @param markdown - README Source
 * @returns Section Titles
 */
export function guideSections(markdown: string): string[] {
  return [...markdown.matchAll(/^## (.+)$/gm)]
    .map((match) => (match[1] ?? "").replace(/`/g, "").trim())
    .filter((title) => !SUMMARY_SKIPPED.has(title));
}

/**
 * Build the Summary Lines Shared by llms.txt and llms-full.txt (title, summary, orientation).
 *
 * @param info - Package Facts
 * @param title - H1 Text
 * @returns Lines
 */
function header(info: PackageInfo, title: string): string[] {
  return [
    `# ${title}`,
    "",
    `> ${info.description} Version ${info.version}, MIT license, runs in the browser (ES2022).`,
    "",
    "Install with `npm install konfeti`. The everyday API is the shared `Konfeti` object: `Konfeti.fire(options?)`",
    "fires one burst (or a list of bursts) on a fullscreen canvas and returns a handle. `KonfetiFactory.create()`",
    "makes a dedicated instance (own canvas, defaults, particle budget), `createWorker()` from `konfeti/worker`",
    "renders off the main thread, and `konfeti/lite` is the smallest entry (paper only until shapes are registered",
    "with `registerShapes`, no presets). Every option is optional and typed; the API reference gives each option's",
    "unit, range and default.",
  ];
}

/**
 * Build llms.txt (llmstxt.org format): what konfeti is and where its Markdown docs live.
 *
 * @param info - Package Facts
 * @param api - API Reference Pages
 * @returns File Text
 */
export function llmsTxt(info: PackageInfo, api: readonly ApiPage[]): string {
  return [
    ...header(info, "konfeti"),
    "",
    "## Docs",
    "",
    `- [Guide](${SITE_URL}${GUIDE_MD}): every feature with examples (${guideSections(info.readme).join(", ")})`,
    ...api.map(
      (page) =>
        `- [API reference: ${page.module}](${SITE_URL}${page.path}): every export of \`${page.module}\` with option units, ranges and defaults`,
    ),
    "",
    "## Tools",
    "",
    `- [Playground](${SITE_URL}): tune every option live, load a preset, copy the code or a share link`,
    "- [npm package](https://www.npmjs.com/package/konfeti)",
    `- [Source code](${REPO_URL})`,
    "",
    "## Optional",
    "",
    `- [Full documentation in one file](${SITE_URL}${LLMS_FULL}): the guide and the API reference together`,
    `- [Guide in Turkish](${SITE_URL}${GUIDE_TR_MD})`,
    `- [Changelog](${REPO_URL}/blob/main/packages/konfeti/CHANGELOG.md)`,
    "",
  ].join("\n");
}

/**
 * Build llms-full.txt: the summary, the guide and every API reference page in one file.
 *
 * @param info - Package Facts
 * @param api - API Reference Pages
 * @returns File Text
 */
export function llmsFullTxt(info: PackageInfo, api: readonly ApiPage[]): string {
  const parts = [
    [
      ...header(info, `konfeti ${info.version}: full documentation`),
      "",
      `The guide comes first, then the API reference. Index of the separate pages: ${SITE_URL}llms.txt`,
    ].join("\n"),
    siteMarkdown(info.readme).trim(),
    // each page opens with "# <module>"; name it as the API reference so the parts stay apart, and links to
    // another page become anchors, since every page is in this one file
    ...api.map((page) =>
      page.markdown
        .trim()
        .replace(/^# .*$/m, `# API reference: ${page.module}`)
        .replace(/\]\((?:\.\.\/)*[\w/.-]+\.md(#[^)]*)\)/g, "]($1)"),
    ),
  ];

  return `${parts.join("\n\n---\n\n")}\n`;
}
