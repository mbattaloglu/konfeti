import { URL as NodeUrl, fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { guideSections, llmsFullTxt, llmsTxt, siteMarkdown } from "../plugins/llmsText";
import type { ApiPage } from "../plugins/llmsText";
import { readPackageInfo } from "../plugins/siteInfo";

// happy-dom replaces the global URL; file paths need Node's own
const INFO = readPackageInfo(
  fileURLToPath(new NodeUrl("../../packages/konfeti/", import.meta.url)),
);

const API: readonly ApiPage[] = [
  { module: "konfeti", path: "docs/api/konfeti.md", markdown: "# konfeti\n\n## Classes\n" },
  {
    module: "konfeti/worker",
    path: "docs/api/konfeti/worker.md",
    markdown: "# konfeti/worker\n\nReturns [`KonfetiHandle`](../konfeti.md#konfetihandle).\n",
  },
];

describe("siteMarkdown", () => {
  it("makes README links absolute and drops the site-only run flag", () => {
    const page = siteMarkdown(
      "[Türkçe](./README.tr.md) [EN](./README.md) [MIT](../../LICENSE) [log](./CHANGELOG.md) [x](#basics)\n\n```ts run\na();\n```",
    );

    expect(page).toContain("[Türkçe](https://konfeti.mbattaloglu.com/docs/tr.md)");
    expect(page).toContain("[EN](https://konfeti.mbattaloglu.com/docs/index.md)");
    expect(page).toContain("[MIT](https://github.com/mbattaloglu/konfeti/blob/main/LICENSE)");
    expect(page).toContain(
      "[log](https://github.com/mbattaloglu/konfeti/blob/main/packages/konfeti/CHANGELOG.md)",
    );
    expect(page).toContain("[x](#basics)");
    expect(page).toContain("```ts\na();");
  });

  it("leaves no relative link in either README", () => {
    for (const readme of [INFO.readme, INFO.readmeTr]) {
      expect(siteMarkdown(readme)).not.toMatch(/\]\(\.{1,2}\//);
      expect(siteMarkdown(readme)).not.toMatch(/^```\w+ run$/m);
    }
  });
});

describe("llmsTxt", () => {
  it("follows the llmstxt.org layout: title, summary, then link sections", () => {
    const text = llmsTxt(INFO, API);
    const lines = text.split("\n");

    expect(lines[0]).toBe("# konfeti");
    expect(lines[2]).toMatch(/^> .*Version \d+\.\d+\.\d+/);
    expect(text.match(/^## .+$/gm)).toEqual(["## Docs", "## Tools", "## Optional"]);
    expect(text).toContain("- [Guide](https://konfeti.mbattaloglu.com/docs/index.md): ");
    expect(text).toContain(
      "- [API reference: konfeti/worker](https://konfeti.mbattaloglu.com/docs/api/konfeti/worker.md)",
    );
  });

  it("only links absolute URLs", () => {
    for (const [, href] of llmsTxt(INFO, API).matchAll(/\]\(([^)]+)\)/g)) {
      expect(href).toMatch(/^https:\/\//);
    }
  });

  it("summarises the guide by its feature sections", () => {
    const sections = guideSections(INFO.readme);

    expect(sections).toContain("API at a glance");
    expect(sections).toContain("Bundle size & konfeti/lite");
    expect(sections).not.toContain("Contents");
    expect(sections).not.toContain("License");
  });
});

describe("llmsFullTxt", () => {
  it("joins the guide and every API page under its own title", () => {
    const text = llmsFullTxt(INFO, API);

    expect(text).toContain("## API at a glance");
    expect(text).toContain("# API reference: konfeti\n");
    expect(text).toContain("# API reference: konfeti/worker\n");
    expect(text.indexOf("## API at a glance")).toBeLessThan(text.indexOf("# API reference"));
    expect(text).toContain("[`KonfetiHandle`](#konfetihandle)");
  });
});
