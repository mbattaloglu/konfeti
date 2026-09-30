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
   * Soft round flakes and six-armed snow crystals drifting down from the top edge for six seconds.
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
      // without it the height falls back to the paper default and the "circles" turn into ovals
      aspectRatio: 1,
      flip: false,
      rotationSpeed: 0,
      wobble: { amplitude: [4, 12], frequency: [0.2, 0.5] },
      opacity: [0.6, 1],
      fadeIn: 0.05,
    },
    shapes: [
      { type: "paper", weight: 3 },
      {
        // six arms with a V near each tip: open lines, drawn by the stroke
        type: "path",
        weight: 1,
        path: "M12 1.5L12 22.5M21.1 6.8L2.9 17.3M2.9 6.8L21.1 17.3M9.6 3.4L12 5.8L14.4 3.4M3.3 9.8L6.6 8.9L5.7 5.6M5.7 18.4L6.6 15.1L3.3 14.2M14.4 20.6L12 18.2L9.6 20.6M20.7 14.2L17.4 15.1L18.3 18.4M18.3 5.6L17.4 8.9L20.7 9.8",
        size: [10, 17],
        stroke: { color: "#ffffff", width: [1, 1.5] },
        rotationSpeed: [-40, 40],
      },
    ],
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

  /**
   * Jackpot.
   * Gold coins pour down for one and a half seconds, spin, bounce on the bottom edge and settle there (shows the
   * `floor`).
   */
  JACKPOT: {
    particleCount: 120,
    emission: { mode: "stream", duration: 1500 },
    origin: { x: [0.1, 0.9], y: -0.05 },
    angle: 270,
    spread: 25,
    startVelocity: [150, 400],
    lifetime: [4500, 6000],
    physics: { gravity: 1400, drag: 0.8, floor: { y: 1, bounce: 0.45, friction: 0.5 } },
    paper: {
      form: "circle",
      width: [12, 16],
      aspectRatio: 1,
      colors: ["#ffd700", "#ffcc33", "#f5b700", "#c9a227"],
      stroke: { color: "#a67c00", width: 1.2 },
      flip: { axis: "x", frequency: [1.5, 3] },
      shine: 0.9,
      fadeOut: { start: 0.85 },
    },
  },

  /**
   * Level Up.
   * "LEVEL UP!" assembles while stars with trails shoot up from below, and a star burst follows the moment the
   * letters break apart (a list choreographed with `delay`).
   */
  LEVEL_UP: [
    {
      origin: { x: 0.5, y: 0.4 },
      formation: { text: "LEVEL UP!", font: "900 110px sans-serif", assemble: 800, hold: 1000 },
      paper: { colors: ["#39ff14", "#00f0ff", "#fff01f", "#ff6ec7"] },
      shapes: [
        { type: "paper", weight: 3 },
        { type: "star", size: [9, 13], colors: ["#fff01f", "#ffe400", "#fdffb8"] },
      ],
    },
    {
      particleCount: 24,
      origin: { x: [0.15, 0.85], y: 1.02 },
      spread: 30,
      startVelocity: [1500, 2100],
      lifetime: [900, 1300],
      physics: { gravity: 900, drag: 1 },
      shapes: [
        {
          type: "star",
          size: [9, 13],
          colors: ["#fff01f", "#ffe400", "#fdffb8"],
          trail: { length: 20, width: [2, 3], opacity: 0.7 },
        },
      ],
    },
    {
      delay: 1800,
      particleCount: 70,
      origin: { x: 0.5, y: 0.4 },
      spread: 360,
      startVelocity: [600, 1200],
      lifetime: [1400, 2000],
      physics: { gravity: 500, drag: 2.5 },
      shapes: [
        { type: "star", size: [10, 16], colors: ["#fff01f", "#ffe400", "#fdffb8"], shine: 0.6 },
      ],
    },
  ],

  /**
   * Success.
   * A green check mark appears made of confetti, then bursts apart (for "saved", "sent", "done" moments).
   */
  SUCCESS: {
    origin: { x: 0.5, y: 0.45 },
    formation: { text: "✔", font: "900 220px sans-serif", mode: "appear", hold: 900, spacing: 7 },
    paper: { colors: ["#2dc653", "#25a244", "#6ede8a", "#b7efc5"], scale: 0.8 },
  },

  /**
   * Sparkler.
   * Hot, glowing sparks with short trails spray from the center for one and a half seconds (additive `lighter`
   * blending: brightest on dark backgrounds).
   */
  SPARKLER: {
    particleCount: 220,
    emission: { mode: "stream", duration: 1500 },
    origin: { x: 0.5, y: 0.5 },
    spread: 360,
    startVelocity: [400, 1100],
    lifetime: [500, 900],
    physics: { gravity: 500, drag: 2 },
    paper: {
      form: "circle",
      width: [2, 3.5],
      aspectRatio: 1,
      colors: ["#fff6d5", "#ffd98a", "#ffb347"],
      // additive blending gives the glow; a shadow would also blur every trail segment (slow)
      blendMode: "lighter",
      trail: { length: 10, width: [1.5, 2.5], opacity: 0.8 },
      flip: false,
      wobble: false,
      fadeOut: { start: 0.3, easing: "easeInQuad" },
    },
  },

  /**
   * Fireflies.
   * Glowing dots appear over the lower part of the canvas, drift and wander slowly, then fade (made for dark
   * backgrounds; each firefly is a small glow PNG data URL, so it also works in worker instances).
   */
  FIREFLIES: {
    particleCount: 40,
    emission: { mode: "stream", duration: 2500 },
    origin: { x: [0.1, 0.9], y: [0.35, 0.9] },
    spread: 360,
    startVelocity: [10, 40],
    lifetime: [4000, 6500],
    physics: { gravity: -8, drag: 0.8, swirl: { strength: [30, 80], frequency: [0.2, 0.5] } },
    shapes: [
      {
        // the glow is drawn into the image: a canvas shadow blurs every firefly again on every frame (about 30
        // shadowed fireflies took the frame rate down to about 40 fps in Chrome)
        type: "image",
        src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB6klEQVR42s2XzU7CQBSFz4CAWkX8w7hW2cnaFzAuiBvXPp5rN8aF8QVc4w51bURERVD+a9rcIYdhLNhE2yYnt20C57tnZtqpQsij7B4qvi6qazfM/6iwhpbfumGA1C+Mf6omwFidBqJmMGdDFv+eTVn+vSAINUPXWgmjKgNAa2hUNygNNcWcTZNSWXwMDQ0sMBMQKiB2NpoTgCSdJ4wEtGlfqj5nKDcQwGKuDT2lSAwBw7xH6hOQFUJZzDlybZgGkCHp+wygTTukLt3nIRlBqB+6Z3PPcB7AgmhRrnUSoM7bAD4BfInaAjIBMQZgdJ+kyDNkukTSEAygzZskDdOhIRlwCiqg+7SYO2K6QtIQKQHokfk7ybtuCUTXlgID8IxPSYeeybKYrgJYk5pzUNhxsLcL3+HuvoXKA4A3AK8A6lI9iA+Ba1MK/oS0Aej4ufusGK8D2ACwmUfpKIv9A15BDdzeVHF5BeAZQA3Ai4A0jBRGq8IHsCw9Hnsv6pwA5D05KBS3cXJqe4I+4vyshUoZQFVUl1SaxlwYLUkVMP46/px07gFs5VE6Nrs3UrgA8CQANQHQwzAxD2IH8P9DEPkkjNMyjPxBFN2jOPKXUSxex5FvSGKxJYvFpjTybXksPkxi82kWi4/Tv/48/waZ1dSMi+xwdQAAAABJRU5ErkJggg==",
        size: [20, 34],
        blendMode: "lighter",
        opacity: [0.7, 1],
        flip: false,
        wobble: false,
        rotationSpeed: 0,
        fadeIn: 0.25,
        fadeOut: { start: 0.6, easing: "easeInOutQuad" },
      },
    ],
  },

  /**
   * Force Field.
   * A cool-colored rain falls for five seconds; the pointer pushes the drops away as it moves through them (a
   * negative `physics.attract` strength).
   */
  FORCE_FIELD: {
    particleCount: 260,
    emission: { mode: "stream", duration: 5000 },
    origin: { x: [0, 1], y: -0.03 },
    angle: 270,
    spread: 20,
    startVelocity: [150, 320],
    lifetime: [5000, 7000],
    physics: {
      gravity: 220,
      drag: 1.2,
      attract: { target: "pointer", strength: -2600, radius: 160, falloff: "linear" },
    },
    paper: { colors: ["#00f0ff", "#8ecae6", "#ffffff"], width: [4, 7], scale: 0.9 },
  },
} as const satisfies Readonly<Record<string, FireInput>>;

/**
 * Built-in Preset Name (`"SNOW"`, `"FIREWORKS"` …).
 */
export type KonfetiPresetName = keyof typeof KonfetiPresets;
