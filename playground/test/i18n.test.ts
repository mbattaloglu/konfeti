import { describe, expect, it } from "vitest";

import { CONTROL_SECTIONS } from "../src/controls";
import type { Control } from "../src/controlTypes";
import {
  CARDS_TR,
  CONTROLS_TR,
  OPTION_LABELS_TR,
  SECTIONS_TR,
  SHAPE_CONTROLS_TR,
} from "../src/i18n/controlsTr";
import type { ControlText } from "../src/i18n/controlsTr";

/**
 * Easing Names Kept in English on Purpose (standard terms).
 */
const ENGLISH_EASINGS = new Set([
  "easeInQuad",
  "easeOutQuad",
  "easeInOutQuad",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutCubic",
]);

/**
 * Zero Labels Shown the Same in Every Language.
 */
const UNIVERSAL_ZERO_LABELS = new Set(["∞"]);

/**
 * Every Static Control, Card Controls Included.
 */
const CONTROLS: readonly Control[] = CONTROL_SECTIONS.flatMap((section) => [
  ...section.controls,
  ...(section.cards ?? []).flatMap((card) => card.controls),
]);

/**
 * Every Option Value a Select or Chips Control Can Show.
 */
const OPTIONS: ReadonlySet<string> = new Set(
  CONTROLS.flatMap((control) => {
    if (control.kind === "chips") {
      return control.options;
    }

    return control.kind === "select"
      ? [...control.options, ...(control.advancedOptions ?? []), ...(control.derivedOptions ?? [])]
      : [];
  }),
);

/**
 * Find the Turkish Text of a Control the Way the Localizer Does.
 *
 * @param key - Control Key
 * @returns Control Text, or Undefined
 */
function turkishText(key: string): ControlText | undefined {
  return CONTROLS_TR[key] ?? SHAPE_CONTROLS_TR[key.slice(key.indexOf(".") + 1)];
}

describe("Turkish control texts", () => {
  it.each(CONTROLS.map((control) => [control.key, control] as const))(
    "cover %s",
    (_key, control) => {
      const text = turkishText(control.key);

      expect(text?.label, "label").toBeDefined();

      if (control.hint !== undefined) {
        expect(text?.hint, "hint").toBeDefined();
      }

      if (
        control.kind === "range" &&
        control.zeroLabel !== undefined &&
        !UNIVERSAL_ZERO_LABELS.has(control.zeroLabel)
      ) {
        expect(text?.zero, "zero label").toBeDefined();
      }
    },
  );

  it("cover every section, card and option", () => {
    for (const section of CONTROL_SECTIONS) {
      expect(SECTIONS_TR[section.id], section.id).toBeDefined();

      for (const card of section.cards ?? []) {
        expect(CARDS_TR[card.enableKey], card.enableKey).toBeDefined();
      }
    }

    for (const option of OPTIONS) {
      if (!ENGLISH_EASINGS.has(option)) {
        expect(OPTION_LABELS_TR[option], option).toBeDefined();
      }
    }
  });

  it("hold no entry without a control, card or option", () => {
    const keys = new Set(CONTROLS.map((control) => control.key));
    const cards = new Set(
      CONTROL_SECTIONS.flatMap((section) => (section.cards ?? []).map((card) => card.enableKey)),
    );

    expect(Object.keys(CONTROLS_TR).filter((key) => !keys.has(key))).toEqual([]);
    expect(Object.keys(CARDS_TR).filter((key) => !cards.has(key))).toEqual([]);
    expect(Object.keys(OPTION_LABELS_TR).filter((option) => !OPTIONS.has(option))).toEqual([]);
  });
});
