import type { FireInput } from "../types/FireInput";

/**
 * Built-in Presets.
 * Ready-to-fire options, one per member. Every preset is plain, read-only data: pass it to `fire()` as is,
 * inspect it, or combine it with your own settings through {@link extendPreset}.
 *
 * @example
 * ```ts
 * import { Konfeti, KonfetiPresets, extendPreset } from "konfeti";
 *
 * Konfeti.fire(KonfetiPresets.FIREWORKS);
 * Konfeti.fire(extendPreset(KonfetiPresets.SNOW, { emission: { mode: "stream", duration: 10000 } }));
 * Konfeti.fire(extendPreset(KonfetiPresets.STARS, { origin: document.querySelector("#badge")! }));
 * ```
 * @remarks Only in the full `konfeti` entry: presets use several shapes, which `konfeti/lite` leaves out.
 */
export const KonfetiPresets = {
  /**
   * Basic.
   * The library defaults: one classic confetti pop, upward from just below the screen center.
   */
  BASIC: {},

  /**
   * Realistic.
   * Five overlapping bursts with different spreads, speeds and sizes (200 particles in total) for a natural,
   * layered pop.
   */
  // literal data only (no calls, no spreads): anything else keeps presets in bundles that never use them
  REALISTIC: [
    {
      particleCount: 50,
      origin: { y: 0.7 },
      spread: 26,
      startVelocity: [1700, 2300],
      physics: { drag: 3.5 },
    },
    {
      particleCount: 40,
      origin: { y: 0.7 },
      spread: 60,
      startVelocity: [1360, 1840],
      physics: { drag: 3.5 },
    },
    {
      particleCount: 70,
      origin: { y: 0.7 },
      spread: 100,
      startVelocity: [1360, 1840],
      physics: { drag: 5.5 },
      paper: { scale: 0.8 },
    },
    {
      particleCount: 20,
      origin: { y: 0.7 },
      spread: 120,
      startVelocity: [765, 1035],
      physics: { drag: 5 },
      paper: { scale: 1.2 },
    },
    {
      particleCount: 20,
      origin: { y: 0.7 },
      spread: 120,
      startVelocity: [1360, 1840],
      physics: { drag: 3.5 },
    },
  ],

  /**
   * Cannon.
   * A fast, narrow shot from the bottom-left corner towards the upper right.
   */
  CANNON: {
    particleCount: 100,
    origin: { x: 0, y: 0.8 },
    angle: 60,
    spread: 45,
    startVelocity: [1600, 2400],
  },

  /**
   * Side Shots.
   * Two bursts at once, from the left and right edges, aimed towards the center.
   */
  SIDE_SHOTS: [
    {
      particleCount: 70,
      origin: { x: 0, y: 0.75 },
      angle: 60,
      spread: 55,
      startVelocity: [1400, 2200],
    },
    {
      particleCount: 70,
      origin: { x: 1, y: 0.75 },
      angle: 120,
      spread: 55,
      startVelocity: [1400, 2200],
    },
  ],

  /**
   * School Pride.
   * Red and white streams from both sides for three seconds.
   */
  SCHOOL_PRIDE: [
    {
      particleCount: 160,
      emission: { mode: "stream", duration: 3000 },
      origin: { x: 0, y: 0.65 },
      angle: 60,
      spread: 55,
      startVelocity: [1300, 1900],
      paper: { colors: ["#bb0000", "#ffffff"] },
    },
    {
      particleCount: 160,
      emission: { mode: "stream", duration: 3000 },
      origin: { x: 1, y: 0.65 },
      angle: 120,
      spread: 55,
      startVelocity: [1300, 1900],
      paper: { colors: ["#bb0000", "#ffffff"] },
    },
  ],

  /**
   * Fireworks.
   * Eight round explosions at random spots in the upper half, one every 350 ms.
   */
  FIREWORKS: {
    particleCount: 50,
    emission: { mode: "interval", every: 350, times: 8 },
    origin: { x: [0.15, 0.85], y: [0.15, 0.45] },
    spread: 360,
    startVelocity: [500, 1100],
    lifetime: [1400, 2000],
    physics: { gravity: 400, drag: 2.4 },
    paper: {
      form: ["circle", "strip"],
      scale: 0.8,
      flip: false,
      fadeOut: { start: 0.5, easing: "easeInQuad" },
      shine: 0.4,
    },
  },

  /**
   * Snow.
   * Soft white flakes drifting down from the top edge for six seconds.
   */
  SNOW: {
    particleCount: 180,
    emission: { mode: "stream", duration: 6000 },
    origin: { x: [0, 1], y: -0.03 },
    angle: 270,
    spread: 30,
    startVelocity: [20, 80],
    lifetime: [6000, 9000],
    physics: {
      gravity: 30,
      drag: 0.4,
      wind: [-10, 10],
      swirl: { strength: [10, 30], frequency: [0.1, 0.3] },
    },
    paper: {
      form: "circle",
      colors: ["#ffffff", "#e8f4ff"],
      width: [3, 7],
      flip: false,
      rotationSpeed: 0,
      wobble: { amplitude: [4, 12], frequency: [0.2, 0.5] },
      opacity: [0.6, 1],
      fadeIn: 0.05,
    },
  },

  /**
   * Stars.
   * A golden, shiny star burst in every direction from the center.
   */
  STARS: {
    particleCount: 60,
    origin: { x: 0.5, y: 0.45 },
    spread: 360,
    startVelocity: [500, 1100],
    lifetime: [1800, 2600],
    physics: { gravity: 250, drag: 2.5 },
    shapes: [
      {
        type: "star",
        size: [12, 20],
        colors: ["#ffe400", "#ffbd00", "#e89400", "#ffca6c", "#fdffb8"],
        shine: 0.6,
      },
    ],
  },

  /**
   * Emoji Rain.
   * Party emoji falling from the top edge for three seconds.
   */
  EMOJI_RAIN: {
    particleCount: 60,
    emission: { mode: "stream", duration: 3000 },
    origin: { x: [0, 1], y: -0.05 },
    angle: 270,
    spread: 20,
    startVelocity: [100, 300],
    lifetime: [3000, 4000],
    physics: { gravity: 400, drag: 1.2 },
    shapes: [{ type: "emoji", emoji: ["🎉", "🥳", "🎊", "✨"], size: [22, 34] }],
  },

  /**
   * Heart Burst.
   * Pink hearts popping out in every direction and shrinking as they fade.
   */
  HEART_BURST: {
    particleCount: 40,
    spread: 360,
    startVelocity: [400, 900],
    physics: { gravity: 200, drag: 2 },
    shapes: [
      {
        type: "heart",
        size: [14, 22],
        colors: ["#ff4d6d", "#ff758f", "#ff8fa3", "#c9184a"],
        flip: { axis: "y" },
        scaleOverLife: { to: 0.6 },
      },
    ],
  },
} as const satisfies Readonly<Record<string, FireInput>>;

/**
 * Built-in Preset Name (`"SNOW"`, `"FIREWORKS"` …).
 */
export type KonfetiPresetName = keyof typeof KonfetiPresets;
