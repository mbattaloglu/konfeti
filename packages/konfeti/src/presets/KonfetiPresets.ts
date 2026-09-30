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

  /**
   * Shooting Stars.
   * Pale golden stars streaking down across the upper sky with long, fading trails, in six quick volleys
   * (shows the `trail` style option).
   */
  SHOOTING_STARS: {
    particleCount: 5,
    emission: { mode: "interval", every: 220, times: 6 },
    origin: { x: [0.05, 0.6], y: [0.05, 0.3] },
    angle: [-35, -20],
    spread: 8,
    startVelocity: [900, 1400],
    lifetime: [900, 1300],
    physics: { gravity: 120, drag: 0.6 },
    shapes: [
      {
        type: "star",
        size: [8, 12],
        colors: ["#fffbe6", "#ffe38a", "#ffd23f"],
        shine: 0.6,
        trail: { length: 24, width: [2, 3], opacity: 0.75 },
      },
    ],
  },

  /**
   * Magnet.
   * A slow, floating cloud that follows the pointer while it moves over the page (shows `physics.attract`).
   */
  MAGNET: {
    particleCount: 150,
    origin: { x: 0.5, y: 0.5 },
    spread: 360,
    startVelocity: [200, 700],
    lifetime: [6000, 8000],
    physics: {
      gravity: 60,
      drag: 1.6,
      swirl: { strength: [120, 280], frequency: [0.3, 0.8] },
      attract: { target: "pointer", strength: 1600, radius: 500, falloff: "linear" },
    },
    paper: { scale: 0.8, fadeOut: { start: 0.8 } },
  },

  /**
   * Golden.
   * Gold paper with strong glints as the pieces flip (the colors of `KonfetiPalettes.GOLD`).
   */
  GOLDEN: {
    particleCount: 160,
    origin: { y: 0.7 },
    spread: 80,
    startVelocity: [1200, 1800],
    paper: {
      colors: ["#ffd700", "#ffcc33", "#f5b700", "#e6be8a", "#fff1b8", "#c9a227"],
      form: ["rect", "strip"],
      shine: 0.9,
      flip: { frequency: [0.8, 1.6] },
    },
  },

  /**
   * Congrats.
   * Paper and stars fly in from beyond the edges to spell "CONGRATS!", hold it, then burst apart (shows a text
   * `formation`).
   */
  CONGRATS: {
    origin: { x: 0.5, y: 0.42 },
    formation: { text: "CONGRATS!", font: "900 120px sans-serif", hold: 1200 },
    shapes: [
      { type: "paper", weight: 4 },
      { type: "star", size: [9, 13], colors: ["#ffe400", "#ffbd00", "#fdffb8"] },
    ],
  },

  /**
   * Logo Reveal.
   * A star badge appears made of confetti in its own colors, then bursts apart (shows an image `formation`;
   * the badge is a small PNG data URL, so it also works in worker instances).
   */
  LOGO_REVEAL: {
    origin: { x: 0.5, y: 0.45 },
    formation: {
      image:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACO0lEQVR42s1Xr08DMRS+P+Uk7mYQJIgFFGJhCgxiFhQCdwEzQ8gEggSzZIaQIBaCQCCWEwuKQKZwMDUE5hJMxwYr+W7tpdfrde8GC9fkJffjvX6v78fX1nHmGL7HXN9jZU1cZ5HD91jV91jL91joe4xnSCh0qn8JXPM91pcgjY0hbx+OeOd8nBB8wz/FGdjUfgOMMAeYrL465LcnYx4OJlwdeDd9gy5shCNB7vT4HivJUF/sjzj7mE7++vBtWmkiMtDBgA1sldSUcoM/3XzFwGdbn9yS+4RAVzqCOchOiLAnwBFOKrAusDU44docCFRwhNQGUF95j8Smgzk0JwJbtUd5o668vXcVCTUSSk3UTA70UbkoHuSPEuK3681IKLqYE3OL7uibSCb2lFJwjfUXzh+XIsEzpTC1yFZVB8BeUQ9TV985Oo0dwDM1CsAQ7y3VgRB9TCk8KeHdWuwAnik2siAFj4Rq6+k/p2Gr9KLV6XJ/XI/BpeCbSRdzqGSlLdJ1xE4W8TlGqoIPmikwqsBWnw8DWOK9nHBAyU9CmttdzrrLZGDowsaYusEkvwOSdNBys8ChYyMnqwOmFKQq+XInExz/ZtmbUpBZhFnkY1u9lTtMRZinDVXyyRIbKRnbMA8RgfdVMNlq6jfb3mAjIhIVPzd341Cr/Y1nmRro5KZi6maE9rLRLv5BJ/dmRNmOkVt11ZmbTqWXqgPSdjzPgSQP/888kBTiSPbvh9JCHMsLcTEpxNWsMJfTRV/PfwCRz6O9nmJS6gAAAABJRU5ErkJggg==",
      width: 260,
      mode: "appear",
      hold: 1500,
      spacing: 7,
    },
    // smaller pieces keep the star's edges crisp
    paper: { scale: 0.7 },
  },
} as const satisfies Readonly<Record<string, FireInput>>;

/**
 * Built-in Preset Name (`"SNOW"`, `"FIREWORKS"` …).
 */
export type KonfetiPresetName = keyof typeof KonfetiPresets;
