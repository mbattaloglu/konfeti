import { describe, expect, it } from "vitest";

import { ImageSource } from "../../src/utils/ImageSource";
import { WorkerOptionsPreparer } from "../../src/worker/WorkerOptionsPreparer";

/**
 * Small Inline SVG.
 */
const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="gold"/></svg>';

describe("inline SVG images", () => {
  it("recognises markup but not URLs", () => {
    expect(ImageSource.isSvgMarkup(SVG)).toBe(true);
    expect(ImageSource.isSvgMarkup(`  \n${SVG}`)).toBe(true);
    expect(ImageSource.isSvgMarkup(`<?xml version="1.0"?>\n${SVG}`)).toBe(true);
    expect(ImageSource.isSvgMarkup("/coin.svg")).toBe(false);
    expect(ImageSource.isSvgMarkup("data:image/svg+xml,<svg></svg>")).toBe(false);
  });

  it("loads markup as a data: URL image", () => {
    const image = ImageSource.from(SVG).getImage();

    expect(image).toBeInstanceOf(HTMLImageElement);
    expect((image as HTMLImageElement).src).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    // the same markup is cached, not decoded twice
    expect(ImageSource.from(SVG).getImage()).toBe(image);
  });

  it("is rejected with a clear error in worker mode", () => {
    expect(() =>
      WorkerOptionsPreparer.prepare(
        { shapes: [{ type: "image", src: SVG }] },
        { left: 0, top: 0, width: 100, height: 100 },
      ),
    ).toThrow(/inline <svg> images are not supported in worker mode/);
  });
});
