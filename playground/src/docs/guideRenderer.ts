import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import { Marked } from "marked";
import type { Token, Tokens } from "marked";

/**
 * Repository URL for Links that Point Outside the Package README.
 */
const REPO_URL = "https://github.com/mbattaloglu/konfeti/blob/main/";

/**
 * README Language Links, Mapped to the Language of the Same Page.
 */
const README_LINKS: Readonly<Record<string, string>> = {
  "./README.md": "en",
  "./README.tr.md": "tr",
};

/**
 * Language Baked into the Built Guide Page (other languages render in the browser).
 */
export const PRERENDERED_LOCALE = "en";

/**
 * Code Block Button Labels, in the Guide's Language.
 */
export type GuideLabels = {
  /**
   * Run Button Text (fences tagged `ts run`).
   */
  readonly run: string;
  /**
   * Copy Button Text.
   */
  readonly copy: string;
};

/**
 * Rendered Guide Markup.
 */
export type RenderedGuide = {
  /**
   * Intro and Section Blocks for `#docs-content`.
   */
  readonly content: string;
  /**
   * Section Links for `#docs-toc`.
   */
  readonly toc: string;
};

/**
 * One Guide Section Before Rendering.
 */
type Section = {
  /**
   * Anchor Id.
   */
  readonly id: string;
  /**
   * Heading Text.
   */
  readonly title: string;
  /**
   * Section Tokens (heading included).
   */
  readonly tokens: Token[];
};

hljs.registerLanguage("ts", typescript);

/**
 * Create GitHub-Compatible Heading Slug (matches the README's own anchor links).
 *
 * @param text - Heading Text
 * @returns Anchor Id
 */
export function slugify(text: string): string {
  // letters of any script survive (Turkish headings), like GitHub's own anchors
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\-_ ]+/gu, "")
    .replace(/ /g, "-");
}

/**
 * README Sections that the Sidebar Already Covers (English and Turkish headings).
 */
const SKIPPED_SECTIONS = new Set([slugify("Contents"), slugify("İçindekiler")]);

/**
 * Escape Text for HTML.
 *
 * @param text - Raw Text
 * @returns Escaped Text
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render Code Block with Toolbar (copy, plus run for fences tagged `ts run`).
 *
 * @param token - Code Token
 * @param labels - Button Labels
 * @returns HTML
 */
function renderCode(token: Tokens.Code, labels: GuideLabels): string {
  const [language = "", ...flags] = (token.lang ?? "").split(/\s+/);
  const runnable = flags.includes("run");
  const highlighted = hljs.getLanguage(language)
    ? hljs.highlight(token.text, { language }).value
    : escapeHtml(token.text);
  const source = escapeHtml(token.text);

  return `<figure class="code" data-source="${source}">
    <figcaption class="code-bar">
      <span class="code-lang">${escapeHtml(language || "text")}</span>
      ${runnable ? `<button type="button" class="btn btn--small btn--primary" data-action="run">${labels.run}</button>` : ""}
      <button type="button" class="btn btn--small" data-action="copy">${labels.copy}</button>
    </figcaption>
    <pre><code class="hljs">${highlighted}</code></pre>
  </figure>`;
}

/**
 * Resolve README Link for the Site.
 * Language links stay on the same page (`?lang=`); `../../` links point into the repository.
 *
 * @param href - README Link
 * @returns Site Link
 */
function siteHref(href: string): string {
  const language = README_LINKS[href];

  if (language !== undefined) {
    return `?lang=${language}`;
  }

  return href.startsWith("../../") ? REPO_URL + href.slice("../../".length) : href;
}

/**
 * Create Markdown Parser with the Guide's Code, Heading and Link Renderers.
 *
 * @param labels - Code Block Button Labels
 * @returns Parser
 */
function createParser(labels: GuideLabels): Marked {
  return new Marked({
    gfm: true,
    renderer: {
      code: (token) => renderCode(token, labels),
      heading({ tokens, depth, text }) {
        const id = slugify(text);
        const inner = this.parser.parseInline(tokens);
        return `<h${String(depth)} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${inner}</h${String(depth)}>`;
      },
      link({ href, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const target = siteHref(href);
        const external = /^https?:/.test(target) ? ' target="_blank" rel="noopener"' : "";
        return `<a href="${target}"${external}>${inner}</a>`;
      },
    },
  });
}

/**
 * Split README Tokens into Intro and H2 Sections.
 *
 * @param tokens - README Tokens
 * @returns Intro Tokens and Sections
 */
function splitSections(tokens: Token[]): { intro: Token[]; sections: Section[] } {
  const intro: Token[] = [];
  const sections: Section[] = [];

  for (const token of tokens) {
    if (token.type === "heading" && (token as Tokens.Heading).depth === 2) {
      const title = (token as Tokens.Heading).text;
      sections.push({ id: slugify(title), title, tokens: [token] });
    } else if (sections.length === 0) {
      // the H1 is already the page header
      if (!(token.type === "heading" && (token as Tokens.Heading).depth === 1)) {
        intro.push(token);
      }
    } else {
      sections.at(-1)?.tokens.push(token);
    }
  }

  return { intro, sections: sections.filter((section) => !SKIPPED_SECTIONS.has(section.id)) };
}

/**
 * Render README into Guide Markup.
 * Pure string work, so the site build bakes the same markup into the page that the browser renders.
 *
 * @param markdown - README Source
 * @param labels - Code Block Button Labels
 * @returns Content and Sidebar Markup
 */
export function renderGuide(markdown: string, labels: GuideLabels): RenderedGuide {
  const parser = createParser(labels);
  const { intro, sections } = splitSections(parser.lexer(markdown));
  const render = (tokens: Token[]): string => parser.parser(Object.assign(tokens, { links: {} }));
  let content = `<section class="docs-intro">${render(intro)}</section>`;
  let toc = "";

  for (const section of sections) {
    content += `<section class="docs-section" id="section-${section.id}">${render(section.tokens)}</section>`;
    toc += `<a href="#${section.id}" data-section="${section.id}">${escapeHtml(section.title.replace(/`/g, ""))}</a>`;
  }

  return { content, toc };
}
