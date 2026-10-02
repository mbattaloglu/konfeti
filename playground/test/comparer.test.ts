import { KonfetiPresets } from "konfeti";
import type { FireInput, KonfetiPresetName } from "konfeti";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createComparer, resolveBursts } from "./helpers/comparable";

/**
 * Every Built-In Preset Name.
 */
const NAMES = Object.keys(KonfetiPresets) as KonfetiPresetName[];

/**
 * A Data URL That Is Not the Firefly Image.
 */
const OTHER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * Presets the Non-Vacuity Cases Change.
 */
const { SNOW, FIREWORKS, EMOJI_RAIN, CONGRATS, LOGO_REVEAL, FIREFLIES, STARS } = KonfetiPresets;

/**
 * Presets Changed in One Detail the Comparer Must Not Hide: [label, changed, original].
 */
const VARIANTS: readonly (readonly [string, FireInput, FireInput])[] = [
  [
    "SNOW with another path",
    { ...SNOW, shapes: [SNOW.shapes[0], { ...SNOW.shapes[1], path: "M0 0L24 24" }] },
    SNOW,
  ],
  [
    "FIREWORKS with another fade-out easing",
    { ...FIREWORKS, paper: { ...FIREWORKS.paper, fadeOut: { start: 0.5, easing: "easeOutQuad" } } },
    FIREWORKS,
  ],
  [
    "EMOJI_RAIN with another emoji",
    { ...EMOJI_RAIN, shapes: [{ ...EMOJI_RAIN.shapes[0], emoji: ["🎉", "🥳", "🎊", "🎈"] }] },
    EMOJI_RAIN,
  ],
  [
    "CONGRATS with other text",
    { ...CONGRATS, formation: { ...CONGRATS.formation, text: "CONGRATS?" } },
    CONGRATS,
  ],
  [
    "LOGO_REVEAL with another width",
    { ...LOGO_REVEAL, formation: { ...LOGO_REVEAL.formation, width: 261 } },
    LOGO_REVEAL,
  ],
  [
    "FIREFLIES with another image",
    { ...FIREFLIES, shapes: [{ ...FIREFLIES.shapes[0], src: OTHER_IMAGE }] },
    FIREFLIES,
  ],
  // only the cached builder path differs: the star's box is the same
  [
    "STARS with another inner ratio",
    { ...STARS, shapes: [{ ...STARS.shapes[0], innerRatio: 0.3 }] },
    STARS,
  ],
];

beforeEach(() => {
  // the seed of a burst without one comes from Math.random
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolved-equality comparer", () => {
  it.each(VARIANTS)("reports a difference for %s", (_label, changed, original) => {
    const compare = createComparer();

    expect(resolveBursts(changed, compare)).not.toEqual(resolveBursts(original, compare));
  });

  it.each(NAMES)("resolves %s the same way twice", (name) => {
    const compare = createComparer();
    const preset = KonfetiPresets[name];

    expect(resolveBursts(preset, compare)).toEqual(resolveBursts(preset, compare));
  });
});
