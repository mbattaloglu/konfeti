import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plugin } from "vite";

import {
  GUIDE_MD,
  GUIDE_TR_MD,
  LLMS_FULL,
  llmsFullTxt,
  llmsTxt,
  siteMarkdown,
} from "./llmsText.ts";
import type { ApiPage } from "./llmsText.ts";
import { readPackageInfo } from "./siteInfo.ts";

/**
 * API Reference Pages that TypeDoc Writes in Markdown (`typedoc.markdown.json`), by Module.
 */
const API_PAGES = [
  { module: "konfeti", file: "konfeti.md" },
  { module: "konfeti/worker", file: "konfeti/worker.md" },
] as const;

/**
 * Site Folder of the API Reference.
 */
const API_PATH = "docs/api/";

/**
 * Read the Markdown API Reference Pages.
 *
 * @param apiDir - Folder TypeDoc Wrote the Pages to
 * @returns Pages
 */
function readApiPages(apiDir: string): ApiPage[] {
  return API_PAGES.map(({ module, file }) => {
    try {
      return { module, path: API_PATH + file, markdown: readFileSync(join(apiDir, file), "utf8") };
    } catch {
      throw new Error(
        `konfeti site: ${file} is missing from the API reference; build the site with "pnpm site:build"`,
      );
    }
  });
}

/**
 * Emit the LLM-Readable Docs: llms.txt, llms-full.txt and the guide as Markdown (English and Turkish).
 *
 * @param packageDir - Library Package Folder (README and package.json)
 * @param apiDir - Folder with TypeDoc's Markdown API Reference
 * @returns Vite Plugin
 */
export function llmsFiles(packageDir: string, apiDir: string): Plugin {
  return {
    name: "konfeti:llms-files",
    apply: "build",
    generateBundle() {
      const info = readPackageInfo(packageDir);
      const api = readApiPages(apiDir);
      const files: Readonly<Record<string, string>> = {
        "llms.txt": llmsTxt(info, api),
        [LLMS_FULL]: llmsFullTxt(info, api),
        [GUIDE_MD]: siteMarkdown(info.readme),
        [GUIDE_TR_MD]: siteMarkdown(info.readmeTr),
      };

      for (const [fileName, source] of Object.entries(files)) {
        this.emitFile({ type: "asset", fileName, source });
      }
    },
  };
}
