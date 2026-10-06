import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import type { Plugin } from "vite";

import { crawlerFiles } from "./plugins/crawlerFiles";
import { prerenderGuide } from "./plugins/prerenderGuide";

/**
 * Resolve a Path Relative to This Config.
 *
 * @param path - Relative Path
 * @returns Absolute Path
 */
const local = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * Production Base Path (mbattaloglu.com/tools/konfeti).
 */
const BASE = "/tools/konfeti/";

/**
 * Serve Production URLs in Development.
 * The API reference (TypeDoc) links to absolute `/tools/konfeti/...` URLs; in dev the site lives at `/`, so
 * strip the prefix. Directory URLs under `public/` get their `index.html` (Vite only serves exact files there).
 *
 * @returns Vite Plugin
 */
function productionPaths(): Plugin {
  return {
    name: "konfeti:production-paths",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        let url = request.url ?? "/";

        if (url.startsWith(BASE)) {
          url = url.slice(BASE.length - 1);
        }

        // public/docs/api is a static site: /docs/api/ -> /docs/api/index.html
        if (url.startsWith("/docs/api") && !/\.[a-z0-9]+(\?.*)?$/i.test(url)) {
          url = `${url.replace(/\/?(\?.*)?$/, "")}/index.html`;
        }

        request.url = url;
        next();
      });
    },
  };
}

/**
 * Vite configuration for the konfeti site (playground at `/`, guide at `/docs/`).
 *
 * The port is pinned with `strictPort` so it never drifts onto another local project (5173/5174).
 * Production is reached through mbattaloglu.com/tools/konfeti, so the build emits that base path while
 * local development stays at `/` — the same convention as Framesheet and Recast.
 */
export default defineConfig(({ command }) => ({
  base: command === "build" ? BASE : "/",
  plugins: [productionPaths(), prerenderGuide(local("../packages/konfeti/")), crawlerFiles()],
  server: {
    port: 5199,
    strictPort: true,
  },
  resolve: {
    // use library source directly so the site reflects edits without a library build; exact matches, so
    // "konfeti/worker" is not rewritten as "konfeti" + "/worker"
    alias: [
      { find: /^konfeti$/, replacement: local("../packages/konfeti/src/index.ts") },
      { find: /^konfeti\/worker$/, replacement: local("../packages/konfeti/src/workerEntry.ts") },
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        playground: local("index.html"),
        docs: local("docs/index.html"),
      },
    },
  },
}));
