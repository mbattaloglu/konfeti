import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import { VERSION } from "konfeti";
import { marked } from "marked";
import type { Token, Tokens } from "marked";

import readme from "../../../packages/konfeti/README.md?raw";
import { byId, el } from "../ui/dom";
import { runExample } from "./runExample";

/**
 * Repository URL for Links that Point Outside the Package README.
 */
const REPO_URL = "https://github.com/mbattaloglu/konfeti/blob/main/";

/**
 * README Sections that the Sidebar Already Covers.
 */
const SKIPPED_SECTIONS = new Set(["contents"]);

/**
 * Toast Visibility Duration.
 */
const TOAST_MS = 2200;

hljs.registerLanguage("ts", typescript);

/**
 * Create GitHub-Compatible Heading Slug (matches the README's own anchor links).
 *
 * @param text - Heading Text
 * @returns Anchor Id
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\- ]+/g, "")
    .replace(/ /g, "-");
}

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
 * @returns HTML
 */
function renderCode(token: Tokens.Code): string {
  const [language = "", ...flags] = (token.lang ?? "").split(/\s+/);
  const runnable = flags.includes("run");
  const highlighted = hljs.getLanguage(language)
    ? hljs.highlight(token.text, { language }).value
    : escapeHtml(token.text);
  const source = escapeHtml(token.text);

  return `<figure class="code" data-source="${source}">
    <figcaption class="code-bar">
      <span class="code-lang">${escapeHtml(language || "text")}</span>
      ${runnable ? '<button type="button" class="btn btn--small btn--primary" data-action="run">▶ Run</button>' : ""}
      <button type="button" class="btn btn--small" data-action="copy">Copy</button>
    </figcaption>
    <pre><code class="hljs">${highlighted}</code></pre>
  </figure>`;
}

marked.use({
  gfm: true,
  renderer: {
    code: (token) => renderCode(token),
    heading: ({ tokens, depth, text }) => {
      const id = slugify(text);
      const inner = marked.Parser.parseInline(tokens);
      return `<h${String(depth)} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${inner}</h${String(depth)}>`;
    },
    link: ({ href, tokens }) => {
      const inner = marked.Parser.parseInline(tokens);
      // README links like ../../LICENSE point into the repository, not the site
      const target = href.startsWith("../../") ? REPO_URL + href.slice("../../".length) : href;
      const external = /^https?:/.test(target) ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${target}"${external}>${inner}</a>`;
    },
  },
});

/**
 * One Rendered Guide Section.
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
 * Render Token List to HTML.
 *
 * @param tokens - Tokens
 * @returns HTML
 */
function render(tokens: Token[]): string {
  return marked.parser(Object.assign(tokens, { links: {} }));
}

/**
 * Wire Up the Docs Page.
 */
function init(): void {
  const content = byId("docs-content", HTMLElement);
  const toc = byId("docs-toc", HTMLElement);
  const toast = byId("toast", HTMLElement);
  const { intro, sections } = splitSections(marked.lexer(readme));
  let toastTimer = 0;

  byId("version", HTMLElement).textContent = `v${VERSION}`;

  const showToast = (message: string, isError = false): void => {
    toast.textContent = message;
    toast.classList.toggle("is-error", isError);
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, TOAST_MS);
  };

  const introBlock = el("section", "docs-intro");
  introBlock.innerHTML = render(intro);
  content.append(introBlock);

  for (const section of sections) {
    const block = el("section", "docs-section");
    block.id = `section-${section.id}`;
    block.innerHTML = render(section.tokens);
    content.append(block);

    const link = el("a", undefined, section.title.replace(/`/g, ""));
    link.href = `#${section.id}`;
    link.dataset["section"] = section.id;
    toc.append(link);
  }

  // copy / run buttons on every code block
  content.addEventListener("click", (event) => {
    const button =
      event.target instanceof Element ? event.target.closest("button[data-action]") : null;
    const figure = button?.closest("figure.code");

    if (!(button instanceof HTMLButtonElement) || !(figure instanceof HTMLElement)) {
      return;
    }

    const source = figure.dataset["source"] ?? "";

    if (button.dataset["action"] === "copy") {
      navigator.clipboard.writeText(source).then(
        () => {
          showToast("Copied");
        },
        () => {
          showToast("Clipboard unavailable", true);
        },
      );
      return;
    }

    runExample(source).catch((error: unknown) => {
      showToast(error instanceof Error ? error.message : String(error), true);
    });
  });

  // highlight the section currently in view
  const links = [...toc.querySelectorAll<HTMLAnchorElement>("a[data-section]")];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace(/^section-/, "");
          for (const link of links) {
            link.classList.toggle("is-active", link.dataset["section"] === id);
          }
        }
      }
    },
    { rootMargin: "-20% 0px -70% 0px" },
  );

  for (const block of content.querySelectorAll(".docs-section")) {
    observer.observe(block);
  }

  // honour a deep link after the content exists
  if (location.hash !== "") {
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
}

init();
