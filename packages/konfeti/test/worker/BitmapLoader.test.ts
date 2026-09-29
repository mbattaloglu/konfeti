import { afterEach, describe, expect, it, vi } from "vitest";

import { ImageSource } from "../../src/utils/ImageSource";
import { BitmapLoader } from "../../src/worker/BitmapLoader";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BitmapLoader", () => {
  it("loads URLs as bitmaps when there is no Image element", async () => {
    const bitmap = { width: 24, height: 12 };
    vi.stubGlobal("Image", undefined);
    vi.stubGlobal("fetch", () => Promise.resolve({ blob: () => Promise.resolve(new Blob()) }));
    vi.stubGlobal("createImageBitmap", () => Promise.resolve(bitmap));
    ImageSource.setUrlLoader((url) => BitmapLoader.load(url));

    const source = ImageSource.from("https://example.com/coin.png");
    expect(source.isReady()).toBe(false);
    expect(ImageSource.from("https://example.com/coin.png")).toBe(source);

    await vi.waitFor(() => {
      expect(source.isReady()).toBe(true);
    });
    expect(source.getWidth()).toBe(24);
  });
});
