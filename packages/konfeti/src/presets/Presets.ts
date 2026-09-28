import type { FireInput } from "../types/FireInput";
import type { FireOptions } from "../types/FireOptions";
import { PresetUtils } from "./PresetUtils";

/**
 * Preset Builder.
 * Returns ready-to-fire options; `overrides` are merged into every burst of the preset.
 */
export type Preset = (overrides?: FireOptions) => FireInput;

/**
 * Built-in Preset Name.
 */
export type PresetName =
  | "basic"
  | "realistic"
  | "cannon"
  | "sideShots"
  | "schoolPride"
  | "fireworks"
  | "snow"
  | "stars"
  | "emojiRain"
  | "heartBurst";

/**
 * Realistic Burst Layers as `[share, spread, velocity, drag, scale]`.
 * Several overlapping bursts with different spreads/speeds look far more natural than one.
 */
const REALISTIC_LAYERS: readonly (readonly [number, number, number, number, number])[] = [
  [0.25, 26, 2000, 3.5, 1],
  [0.2, 60, 1600, 3.5, 1],
  [0.35, 100, 1600, 5.5, 0.8],
  [0.1, 120, 900, 5, 1.2],
  [0.1, 120, 1600, 3.5, 1],
];

/**
 * Total Particles of the Realistic Preset.
 */
const REALISTIC_TOTAL = 200;

/**
 * Built-in Presets.
 * Every preset is plain data — inspect it, tweak it, or pass overrides.
 *
 * @example
 * ```ts
 * Konfeti.fire(presets.fireworks());
 * Konfeti.fire(presets.snow({ emission: { mode: "stream", duration: 10000 } }));
 * Konfeti.fire(presets.stars({ origin: document.querySelector("#badge")! }));
 * ```
 */
export const presets: Readonly<Record<PresetName, Preset>> = {
  basic: (overrides) => PresetUtils.apply([{}], overrides),

  realistic: (overrides) =>
    PresetUtils.apply(
      REALISTIC_LAYERS.map(([share, spread, velocity, drag, scale]) => ({
        particleCount: Math.floor(REALISTIC_TOTAL * share),
        origin: { y: 0.7 },
        spread,
        startVelocity: [velocity * 0.85, velocity * 1.15],
        physics: { drag },
        paper: { scale },
      })),
      overrides,
    ),

  cannon: (overrides) =>
    PresetUtils.apply(
      [
        {
          particleCount: 100,
          origin: { x: 0, y: 0.8 },
          angle: 60,
          spread: 45,
          startVelocity: [1600, 2400],
        },
      ],
      overrides,
    ),

  sideShots: (overrides) =>
    PresetUtils.apply(
      [
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
      overrides,
    ),

  schoolPride: (overrides) => {
    const shared: FireOptions = {
      particleCount: 160,
      emission: { mode: "stream", duration: 3000 },
      spread: 55,
      startVelocity: [1300, 1900],
      paper: { colors: ["#bb0000", "#ffffff"] },
    };

    return PresetUtils.apply(
      [
        { ...shared, origin: { x: 0, y: 0.65 }, angle: 60 },
        { ...shared, origin: { x: 1, y: 0.65 }, angle: 120 },
      ],
      overrides,
    );
  },

  fireworks: (overrides) =>
    PresetUtils.apply(
      [
        {
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
      ],
      overrides,
    ),

  snow: (overrides) =>
    PresetUtils.apply(
      [
        {
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
      ],
      overrides,
    ),

  stars: (overrides) =>
    PresetUtils.apply(
      [
        {
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
      ],
      overrides,
    ),

  emojiRain: (overrides) =>
    PresetUtils.apply(
      [
        {
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
      ],
      overrides,
    ),

  heartBurst: (overrides) =>
    PresetUtils.apply(
      [
        {
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
      ],
      overrides,
    ),
};
