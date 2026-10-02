import { DEMO_SHEET_FRAMES } from "../../src/demoAssets";
import type { DemoAssets } from "../../src/demoAssets";

/**
 * Create Stand-Ins for the Demo Assets.
 * Plain canvases and fixed `blob:` strings: the builder and the loader only compare them by identity, so the real
 * (asynchronous) createDemoAssets() is never needed.
 *
 * @returns Demo Assets
 */
export function createFakeAssets(): DemoAssets {
  return {
    coinCanvas: document.createElement("canvas"),
    coinUrl: "blob:coin",
    sheetCanvas: document.createElement("canvas"),
    sheetUrl: "blob:sheet",
    sheetFrames: DEMO_SHEET_FRAMES,
    logoCanvas: document.createElement("canvas"),
  };
}
