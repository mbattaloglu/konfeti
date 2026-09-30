import { describe, expect, it } from "vitest";

import { OptionResolver } from "../../src/core/resolve/OptionResolver";
import { DEFAULT_PALETTE } from "../../src/config/PaperDefaults";
import { KonfetiPalettes } from "../../src/palettes/KonfetiPalettes";
import type { KonfetiPaletteName } from "../../src/palettes/KonfetiPalettes";

describe("KonfetiPalettes", () => {
  it.each(Object.keys(KonfetiPalettes) as KonfetiPaletteName[])(
    "%s resolves as paper colors",
    (name) => {
      const palette = KonfetiPalettes[name];
      const resolved = OptionResolver.resolveFire([{ paper: { colors: palette } }]).shapes.items[0]
        ?.style.palette;

      expect(palette.length).toBeGreaterThanOrEqual(5);
      expect(resolved?.colors).toHaveLength(palette.length);
    },
  );

  it("keeps CLASSIC equal to the library default", () => {
    expect(KonfetiPalettes.CLASSIC).toEqual(DEFAULT_PALETTE);
  });
});
