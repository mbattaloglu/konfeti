import { describe, expect, it } from "vitest";

import readmeEn from "../../packages/konfeti/README.md?raw";
import { renderGuide } from "../src/docs/guideRenderer";

const LABELS = { run: "Run", copy: "Copy" };

describe("renderGuide", () => {
  it("splits the README into an intro and one section per H2, without the Contents list", () => {
    const guide = renderGuide(readmeEn, LABELS);

    expect(guide.content.startsWith('<section class="docs-intro">')).toBe(true);
    expect(guide.content).toContain('<section class="docs-section" id="section-api-at-a-glance">');
    expect(guide.toc).toContain('<a href="#api-at-a-glance" data-section="api-at-a-glance">');
    expect(guide.toc).not.toContain('data-section="contents"');
  });

  it("keeps language links on the page and sends repository links to GitHub", () => {
    const guide = renderGuide(
      "# t\n\n[Türkçe](./README.tr.md) · [MIT](../../LICENSE)\n\n## A\n\ntext",
      LABELS,
    );

    expect(guide.content).toContain('<a href="?lang=tr">Türkçe</a>');
    expect(guide.content).toContain(
      '<a href="https://github.com/mbattaloglu/konfeti/blob/main/LICENSE" target="_blank" rel="noopener">MIT</a>',
    );
  });

  it("gives runnable fences a run button and keeps the source for copying", () => {
    const guide = renderGuide(
      "## A\n\n```ts run\nconst a = `$1`;\n```\n\n```ts\nb();\n```",
      LABELS,
    );

    expect(guide.content.match(/data-action="run">Run</g)).toHaveLength(1);
    expect(guide.content.match(/data-action="copy">Copy</g)).toHaveLength(2);
    expect(guide.content).toContain('data-source="const a = `$1`;"');
  });

  it("escapes section titles in the sidebar", () => {
    const guide = renderGuide("## Ads & `webviews`\n\ntext", LABELS);

    expect(guide.toc).toContain(">Ads &amp; webviews</a>");
  });
});
