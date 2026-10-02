import { afterEach, describe, expect, it, vi } from "vitest";

import type { Control, ControlSection } from "../src/controlTypes";
import type * as ControlsTr from "../src/i18n/controlsTr";

/**
 * Turkish Zero Text Given to the Attract Radius by the Mocked Text Table (S1 has no real one yet).
 */
const MOCK_ZERO = "sınırsız";

/**
 * Find a Control in a Control Table, Card Controls Included.
 *
 * @param sections - Control Sections
 * @param key - Control Key
 * @returns The Control, or Undefined
 */
function controlOf(sections: readonly ControlSection[], key: string): Control | undefined {
  return sections
    .flatMap((section) => [
      ...section.controls,
      ...(section.cards ?? []).flatMap((card) => card.controls),
    ])
    .find((control) => control.key === key);
}

/**
 * Read the Zero Label of a Range Control.
 *
 * @param control - Any Control
 * @returns Zero Label, or Undefined for Other Controls
 */
function zeroLabelOf(control: Control | undefined): string | undefined {
  return control?.kind === "range" ? control.zeroLabel : undefined;
}

/**
 * Load the Control Table in Turkish (fresh modules, so the language is detected again).
 *
 * @returns Turkish Control Sections
 */
async function turkishSections(): Promise<readonly ControlSection[]> {
  history.replaceState(null, "", "/?lang=tr");
  vi.resetModules();
  const { localizeSections } = await import("../src/i18n/localizeControls");
  const { CONTROL_SECTIONS } = await import("../src/controls");

  return localizeSections(CONTROL_SECTIONS);
}

afterEach(() => {
  vi.doUnmock("../src/i18n/controlsTr");
  history.replaceState(null, "", "/");
});

describe("localizeSections", () => {
  it("keeps a zero label that reads the same in every language", async () => {
    const radius = controlOf(await turkishSections(), "attractRadius");

    expect(radius?.label).toBe("Erişim");
    expect(zeroLabelOf(radius)).toBe("∞");
  });

  it("shows the Turkish zero text of a range control", async () => {
    vi.doMock("../src/i18n/controlsTr", async (importOriginal) => {
      const actual = await importOriginal<typeof ControlsTr>();

      return {
        ...actual,
        CONTROLS_TR: {
          ...actual.CONTROLS_TR,
          attractRadius: { ...actual.CONTROLS_TR["attractRadius"], zero: MOCK_ZERO },
        },
      };
    });

    expect(zeroLabelOf(controlOf(await turkishSections(), "attractRadius"))).toBe(MOCK_ZERO);
  });
});
