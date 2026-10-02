import { describe, expect, it } from "vitest";

import { presetCode, toCode } from "../src/share/codeExport";
import { createFakeAssets } from "./helpers/fakeAssets";

const assets = createFakeAssets();

describe("code export", () => {
  it("writes an unchanged preset as itself", () => {
    const code = presetCode("SNOW");

    expect(code).toContain('import { Konfeti, KonfetiPresets } from "konfeti";');
    expect(code).toContain("Konfeti.fire(KonfetiPresets.SNOW);");
  });

  it("writes several bursts as a list", () => {
    const code = toCode([{ particleCount: 10 }, {}], assets, "changed");

    expect(code).toContain("Konfeti.fire([\n  {\n    particleCount: 10,\n  },\n  {},\n]);");
  });
});
