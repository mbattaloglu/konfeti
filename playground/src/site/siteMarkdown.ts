import { GUIDE_MD, GUIDE_TR_MD, REPO_URL, SITE_URL } from "./siteUrls.ts";

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
