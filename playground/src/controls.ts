import type {
  ChipsControl,
  ColorControl,
  ControlCard,
  ControlCondition,
  ControlSection,
  FileControl,
  PaletteControl,
  RangeControl,
  SelectControl,
  TextControl,
  ToggleControl,
} from "./controlTypes";

/**
 * Optional Control Extras (tooltip + enable condition).
 */
type Extra = {
  /**
   * Tooltip Text.
   */
  readonly hint?: string;
  /**
   * Enable Condition.
   */
  readonly when?: ControlCondition;
};

/**
 * Optional Slider Extras.
 */
type RangeExtra = Extra & {
  /**
   * Unit Suffix.
   */
  readonly unit?: string;
};

/**
 * Slider Bounds as `[min, max, step]`.
 */
type Bounds = readonly [min: number, max: number, step: number];

/**
 * Easing Names Offered in Dropdowns.
 */
const EASINGS = [
  "linear",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutQuad",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutCubic",
] as const;

/**
 * Canvas Blend Modes Offered in the Dropdown.
 */
const BLEND_MODES = [
  "source-over",
  "lighter",
  "multiply",
  "screen",
  "overlay",
  "difference",
  "exclusion",
  "color-dodge",
] as const;

/**
 * Create Slider Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param bounds - Min, Max, Step
 * @param initial - Initial Value
 * @param extra - Hint, Condition, Unit
 * @returns Range Control
 */
function range(
  key: string,
  label: string,
  param: string,
  bounds: Bounds,
  initial: number,
  extra: RangeExtra = {},
): RangeControl {
  const [min, max, step] = bounds;

  return { kind: "range", key, label, param, min, max, step, initial, ...extra };
}

/**
 * Create Dropdown Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param options - Choices
 * @param initial - Initial Choice
 * @param extra - Hint, Condition
 * @returns Select Control
 */
function select(
  key: string,
  label: string,
  param: string,
  options: readonly string[],
  initial: string,
  extra: Extra = {},
): SelectControl {
  return { kind: "select", key, label, param, options, initial, ...extra };
}

/**
 * Create Switch Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param initial - Initial State
 * @param extra - Hint, Condition
 * @returns Toggle Control
 */
function toggle(
  key: string,
  label: string,
  param: string,
  initial: boolean,
  extra: Extra = {},
): ToggleControl {
  return { kind: "toggle", key, label, param, initial, ...extra };
}

/**
 * Create Text Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param initial - Initial Text
 * @param extra - Hint, Condition
 * @returns Text Control
 */
function text(
  key: string,
  label: string,
  param: string,
  initial: string,
  extra: Extra = {},
): TextControl {
  return { kind: "text", key, label, param, initial, ...extra };
}

/**
 * Create Color Picker Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param initial - Initial Hex Color
 * @param extra - Hint, Condition
 * @returns Color Control
 */
function color(
  key: string,
  label: string,
  param: string,
  initial: string,
  extra: Extra = {},
): ColorControl {
  return { kind: "color", key, label, param, initial, ...extra };
}

/**
 * Create Editable Color List Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param initial - Initial Hex Colors
 * @param emptyLabel - Text Shown for an Empty List
 * @param extra - Hint, Condition
 * @returns Palette Control
 */
function palette(
  key: string,
  label: string,
  param: string,
  initial: readonly string[],
  emptyLabel: string,
  extra: Extra = {},
): PaletteControl {
  return { kind: "palette", key, label, param, initial, emptyLabel, ...extra };
}

/**
 * Create Multi-Select Pill Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param options - Choices
 * @param initial - Initially Selected
 * @param extra - Hint, Condition
 * @returns Chips Control
 */
function chips(
  key: string,
  label: string,
  param: string,
  options: readonly string[],
  initial: readonly string[],
  extra: Extra = {},
): ChipsControl {
  return { kind: "chips", key, label, param, options, initial, ...extra };
}

/**
 * Create File Picker Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param accept - Accepted MIME Types
 * @param extra - Hint, Condition
 * @returns File Control
 */
function file(
  key: string,
  label: string,
  param: string,
  accept: string,
  extra: Extra = {},
): FileControl {
  return { kind: "file", key, label, param, accept, ...extra };
}

/**
 * Create Weight Slider for a Shape Card.
 *
 * @param type - Shape Type (state key prefix)
 * @returns Weight Control
 */
function weight(type: string): RangeControl {
  return range(`${type}.weight`, "Weight", "shapes[].weight", [0.1, 10, 0.1], 1, {
    hint: "Relative pick chance inside the shape mix.",
  });
}

/**
 * Create Size Slider for a Shape Card.
 *
 * @param type - Shape Type (state key prefix)
 * @param initial - Initial Size
 * @returns Size Control
 */
function size(type: string, initial: number): RangeControl {
  return range(`${type}.size`, "Size", "shapes[].size", [4, 80, 1], initial, { unit: "px" });
}

/**
 * Shape Cards (one per `ShapeOptions` type).
 */
const SHAPE_CARDS: readonly ControlCard[] = [
  {
    title: "Paper",
    param: '{ type: "paper" }',
    enableKey: "paper.enabled",
    initialEnabled: false,
    controls: [weight("paper")],
  },
  {
    title: "Star",
    param: '{ type: "star" }',
    enableKey: "star.enabled",
    initialEnabled: false,
    controls: [
      weight("star"),
      size("star", 16),
      range("star.points", "Points", "shapes[].points", [3, 12, 1], 5),
      range("star.innerRatio", "Inner Ratio", "shapes[].innerRatio", [0.1, 0.9, 0.05], 0.5),
      palette("star.colors", "Colors Override", "shapes[].colors", [], "Inherit Paper Colors", {
        hint: "Empty = inherit paper.colors.",
      }),
    ],
  },
  {
    title: "Triangle",
    param: '{ type: "triangle" }',
    enableKey: "triangle.enabled",
    initialEnabled: false,
    controls: [weight("triangle"), size("triangle", 12)],
  },
  {
    title: "Polygon",
    param: '{ type: "polygon" }',
    enableKey: "polygon.enabled",
    initialEnabled: false,
    controls: [
      weight("polygon"),
      size("polygon", 12),
      range("polygon.sides", "Sides", "shapes[].sides", [3, 12, 1], 6),
    ],
  },
  {
    title: "Heart",
    param: '{ type: "heart" }',
    enableKey: "heart.enabled",
    initialEnabled: false,
    controls: [
      weight("heart"),
      size("heart", 16),
      palette(
        "heart.colors",
        "Colors Override",
        "shapes[].colors",
        ["#ff3d7f", "#ff8fb1", "#e0115f"],
        "Inherit Paper Colors",
        { hint: "Empty = inherit paper.colors." },
      ),
    ],
  },
  {
    title: "Ribbon",
    param: '{ type: "ribbon" }',
    enableKey: "ribbon.enabled",
    initialEnabled: false,
    controls: [
      weight("ribbon"),
      range("ribbon.length", "Length", "shapes[].length", [6, 120, 1], 30, { unit: "px" }),
      range("ribbon.thickness", "Thickness", "shapes[].thickness", [0.02, 0.5, 0.01], 0.14, {
        hint: "Width as a ratio of the length.",
      }),
      range("ribbon.waves", "Waves", "shapes[].waves", [0, 6, 0.5], 2),
    ],
  },
  {
    title: "SVG Path",
    param: '{ type: "path" }',
    enableKey: "path.enabled",
    initialEnabled: false,
    controls: [
      weight("path"),
      size("path", 18),
      text("path.d", "Path Data", "shapes[].path", "M13 2 3 14h9l-1 8 10-12h-9l1-8z", {
        hint: "SVG path `d` string drawn inside the viewBox.",
      }),
      range("path.viewBox", "View Box", "shapes[].viewBox", [8, 128, 1], 24, {
        hint: "Emitted as [value, value].",
      }),
    ],
  },
  {
    title: "Emoji",
    param: '{ type: "emoji" }',
    enableKey: "emoji.enabled",
    initialEnabled: false,
    controls: [
      weight("emoji"),
      size("emoji", 24),
      text("emoji.list", "Emoji", "shapes[].emoji", "🎉, ✨, 🥳, 🎊", {
        hint: "Comma-separated list.",
      }),
    ],
  },
  {
    title: "Text",
    param: '{ type: "text" }',
    enableKey: "text.enabled",
    initialEnabled: false,
    controls: [
      weight("text"),
      size("text", 18),
      text("text.list", "Text", "shapes[].text", "YAY, WOW, +1", { hint: "Comma-separated list." }),
      text("text.fontFamily", "Font Family", "shapes[].fontFamily", "Inter, system-ui, sans-serif"),
      select("text.fontWeight", "Font Weight", "shapes[].fontWeight", ["400", "700", "900"], "700"),
    ],
  },
  {
    title: "Image",
    param: '{ type: "image" }',
    enableKey: "image.enabled",
    initialEnabled: false,
    controls: [
      weight("image"),
      size("image", 24),
      select(
        "image.src",
        "Source",
        "shapes[].src",
        ["demo canvas", "demo url", "upload"],
        "demo canvas",
        {
          hint: "Demo canvas passes the element itself; demo url passes a blob URL string.",
        },
      ),
      file("image.upload", "Upload Image", "shapes[].src", "image/*", {
        hint: "Pick any image; it is passed as an object URL.",
      }),
    ],
  },
  {
    title: "Sprite Sheet",
    param: '{ type: "spritesheet" }',
    enableKey: "sprite.enabled",
    initialEnabled: false,
    controls: [
      weight("sprite"),
      size("sprite", 26),
      select("sprite.src", "Source", "shapes[].src", ["demo canvas", "demo url"], "demo canvas", {
        hint: "Procedural 8-frame spinning coin (one row).",
      }),
      range("sprite.fps", "Frames Per Second", "shapes[].fps", [1, 60, 1], 12, { unit: "fps" }),
      toggle("sprite.loop", "Loop", "shapes[].loop", true),
      toggle("sprite.randomStart", "Random Start Frame", "shapes[].randomStartFrame", true),
    ],
  },
];

/**
 * Playground Control Table (initial values mirror library defaults where they exist).
 */
export const CONTROL_SECTIONS: readonly ControlSection[] = [
  {
    id: "burst",
    title: "Burst",
    icon: "✦",
    open: true,
    controls: [
      range("particleCount", "Particle Count", "particleCount", [1, 800, 1], 60),
      range("angle", "Angle", "angle", [0, 360, 1], 90, {
        unit: "°",
        hint: "Launch direction. 90 = straight up.",
      }),
      range("spread", "Spread", "spread", [0, 360, 1], 60, {
        unit: "°",
        hint: "Cone width around the angle.",
      }),
      range("velocityMin", "Start Velocity Min", "startVelocity[0]", [0, 4000, 50], 1000, {
        unit: "px/s",
      }),
      range("velocityMax", "Start Velocity Max", "startVelocity[1]", [0, 4000, 50], 1800, {
        unit: "px/s",
      }),
      range("lifetime", "Lifetime", "lifetime", [300, 12000, 100], 3200, {
        unit: "ms",
        hint: "Emitted as [value × (1 − jitter), value × (1 + jitter)].",
      }),
      range("lifetimeJitter", "Lifetime Jitter", "lifetime", [0, 0.9, 0.05], 0.15, {
        unit: "±",
      }),
      range("originX", "Origin X", "origin.x", [0, 1, 0.01], 0.5),
      range("originY", "Origin Y", "origin.y", [0, 1, 0.01], 0.6),
      range("originSpreadX", "Origin X Spread", "origin.x", [0, 0.5, 0.01], 0, {
        unit: "±",
        hint: "When > 0, origin.x becomes a [x − v, x + v] range.",
      }),
      toggle("useSeed", "Use Seed", "seed", false, {
        hint: "Same seed = same burst, every time.",
      }),
      range("seed", "Seed", "seed", [0, 9999, 1], 42, { when: ["useSeed", true] }),
    ],
  },
  {
    id: "emission",
    title: "Emission",
    icon: "⏱",
    controls: [
      select("emissionMode", "Mode", "emission.mode", ["burst", "stream", "interval"], "burst", {
        hint: "burst = all at once, stream = spread over a duration, interval = repeated shots.",
      }),
      range("streamDuration", "Duration", "emission.duration", [100, 10000, 100], 2000, {
        unit: "ms",
        when: ["emissionMode", "stream"],
      }),
      range("intervalEvery", "Every", "emission.every", [50, 3000, 50], 400, {
        unit: "ms",
        when: ["emissionMode", "interval"],
      }),
      range("intervalTimes", "Times", "emission.times", [1, 30, 1], 5, {
        when: ["emissionMode", "interval"],
      }),
    ],
  },
  {
    id: "geometry",
    title: "Paper Geometry",
    icon: "▭",
    controls: [
      chips("form", "Form", "paper.form", ["rect", "square", "circle", "strip", "leaf"], ["rect"], {
        hint: "Pick one or more; several forms are mixed evenly.",
      }),
      range("widthMin", "Width Min", "paper.width[0]", [1, 60, 1], 6, { unit: "px" }),
      range("widthMax", "Width Max", "paper.width[1]", [1, 60, 1], 10, { unit: "px" }),
      range("heightMin", "Height Min", "paper.height[0]", [1, 80, 1], 10, { unit: "px" }),
      range("heightMax", "Height Max", "paper.height[1]", [1, 80, 1], 16, { unit: "px" }),
      toggle("useAspect", "Use Aspect Ratio", "paper.aspectRatio", false, {
        hint: "Derive height from width × ratio instead of paper.height.",
      }),
      range("aspectRatio", "Aspect Ratio", "paper.aspectRatio", [0.1, 5, 0.05], 1.6, {
        unit: "×",
        when: ["useAspect", true],
      }),
      range("cornerRadius", "Corner Radius", "paper.cornerRadius", [0, 20, 0.5], 0, { unit: "px" }),
      range("skew", "Skew", "paper.skew", [0, 60, 1], 0, {
        unit: "±°",
        hint: "Emitted as [-value, value].",
      }),
    ],
  },
  {
    id: "colors",
    title: "Colors",
    icon: "◐",
    controls: [
      palette(
        "colors",
        "Colors",
        "paper.colors",
        ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],
        "Library Default Palette",
        { hint: "Click a color to edit it, + to add one, × to remove." },
      ),
      select("colorMode", "Color Mode", "paper.colorMode", ["random", "sequence"], "random"),
      palette("backColor", "Back Color", "paper.backColor", [], "Auto · Darker Front", {
        hint: 'Empty = "auto" (front color darkened by Back Shade). Add colors to override.',
      }),
      range("backShade", "Back Shade", "paper.backShade", [0, 1, 0.05], 0.3),
      toggle("gradient", "Gradient", "paper.gradient", false),
      color("gradientA", "Gradient From", "paper.gradient.colors[0]", "#ff5e7e", {
        when: ["gradient", true],
      }),
      color("gradientB", "Gradient To", "paper.gradient.colors[1]", "#26ccff", {
        when: ["gradient", true],
      }),
      range("gradientAngle", "Gradient Angle", "paper.gradient.angle", [0, 360, 5], 45, {
        unit: "°",
        when: ["gradient", true],
      }),
      toggle("colorOverLife", "Color Over Life", "paper.colorOverLife", false),
      color("colorOverLifeTo", "Target Color", "paper.colorOverLife.to", "#ffffff", {
        when: ["colorOverLife", true],
      }),
      select("colorOverLifeEasing", "Easing", "paper.colorOverLife.easing", EASINGS, "linear", {
        when: ["colorOverLife", true],
      }),
      toggle("stroke", "Stroke", "paper.stroke", false),
      color("strokeColor", "Stroke Color", "paper.stroke.color", "#1c1c22", {
        when: ["stroke", true],
      }),
      range("strokeWidth", "Stroke Width", "paper.stroke.width", [0.25, 6, 0.25], 1, {
        unit: "px",
        when: ["stroke", true],
      }),
      range("opacity", "Opacity", "paper.opacity", [0, 1, 0.05], 1),
      select("blendMode", "Blend Mode", "paper.blendMode", BLEND_MODES, "source-over"),
    ],
  },
  {
    id: "motion",
    title: "Motion",
    icon: "↻",
    controls: [
      range("scale", "Scale", "paper.scale", [0.2, 5, 0.1], 1, { unit: "×" }),
      range("rotationMax", "Start Rotation Max", "paper.rotation[1]", [0, 360, 5], 360, {
        unit: "°",
        hint: "Emitted as [0, value].",
      }),
      range("rotationSpeed", "Rotation Speed", "paper.rotationSpeed", [0, 1440, 10], 240, {
        unit: "±°/s",
        hint: "Emitted as [-value, value].",
      }),
      toggle("flip", "Flip", "paper.flip", true),
      select("flipAxis", "Flip Axis", "paper.flip.axis", ["x", "y", "both"], "x", {
        when: ["flip", true],
      }),
      range("flipFrequency", "Flip Frequency", "paper.flip.frequency", [0.1, 6, 0.1], 1.2, {
        unit: "Hz",
        when: ["flip", true],
      }),
      toggle("wobble", "Wobble", "paper.wobble", true),
      range("wobbleAmplitude", "Wobble Amplitude", "paper.wobble.amplitude", [0, 40, 1], 8, {
        unit: "px",
        when: ["wobble", true],
      }),
      range("wobbleFrequency", "Wobble Frequency", "paper.wobble.frequency", [0.1, 5, 0.1], 0.8, {
        unit: "Hz",
        when: ["wobble", true],
      }),
      range("tilt", "Tilt", "paper.tilt", [0, 90, 1], 0, {
        unit: "±°",
        hint: "Emitted as [-value, value].",
      }),
    ],
  },
  {
    id: "life",
    title: "Life & Effects",
    icon: "✧",
    controls: [
      range("fadeIn", "Fade In", "paper.fadeIn", [0, 0.5, 0.01], 0, {
        hint: "Fraction of the lifetime spent fading in.",
      }),
      toggle("fadeOut", "Fade Out", "paper.fadeOut", true),
      range("fadeStart", "Fade Start", "paper.fadeOut.start", [0, 1, 0.05], 0.7, {
        when: ["fadeOut", true],
      }),
      select("fadeEasing", "Fade Easing", "paper.fadeOut.easing", EASINGS, "linear", {
        when: ["fadeOut", true],
      }),
      toggle("scaleOverLife", "Scale Over Life", "paper.scaleOverLife", false),
      range("scaleTo", "Target Scale", "paper.scaleOverLife.to", [0, 3, 0.05], 0, {
        unit: "×",
        when: ["scaleOverLife", true],
      }),
      select("scaleEasing", "Scale Easing", "paper.scaleOverLife.easing", EASINGS, "easeInQuad", {
        when: ["scaleOverLife", true],
      }),
      toggle("shadow", "Shadow", "paper.shadow", false),
      color("shadowColor", "Shadow Color", "paper.shadow.color", "#000000", {
        when: ["shadow", true],
      }),
      range("shadowBlur", "Shadow Blur", "paper.shadow.blur", [0, 30, 1], 6, {
        unit: "px",
        when: ["shadow", true],
      }),
      range("shadowX", "Shadow Offset X", "paper.shadow.offsetX", [-20, 20, 1], 0, {
        unit: "px",
        when: ["shadow", true],
      }),
      range("shadowY", "Shadow Offset Y", "paper.shadow.offsetY", [-20, 20, 1], 3, {
        unit: "px",
        when: ["shadow", true],
      }),
      range("shine", "Shine", "paper.shine", [0, 1, 0.05], 0, {
        hint: "Glossy highlight that sweeps as the particle turns.",
      }),
    ],
  },
  {
    id: "shapes",
    title: "Shapes",
    icon: "★",
    description:
      "Enable shape types to build a weighted mix. With none enabled only paper is fired. Every shape inherits the paper.* style keys.",
    controls: [],
    cards: SHAPE_CARDS,
  },
  {
    id: "physics",
    title: "Physics",
    icon: "⇣",
    controls: [
      range("gravity", "Gravity", "physics.gravity", [-1500, 3000, 50], 700, { unit: "px/s²" }),
      range("drag", "Drag", "physics.drag", [0, 10, 0.1], 3.5, { unit: "/s" }),
      range("wind", "Wind", "physics.wind", [-1500, 1500, 25], 0, { unit: "px/s²" }),
      toggle("useTerminal", "Terminal Velocity", "physics.terminalVelocity", false, {
        hint: "Caps the falling speed.",
      }),
      range("terminalVelocity", "Max Fall Speed", "physics.terminalVelocity", [50, 3000, 50], 600, {
        unit: "px/s",
        when: ["useTerminal", true],
      }),
      toggle("swirl", "Swirl", "physics.swirl", false),
      range("swirlStrength", "Swirl Strength", "physics.swirl.strength", [0, 2000, 10], 200, {
        unit: "px/s²",
        when: ["swirl", true],
      }),
      range("swirlFrequency", "Swirl Frequency", "physics.swirl.frequency", [0.1, 5, 0.1], 0.6, {
        unit: "Hz",
        when: ["swirl", true],
      }),
      toggle("floor", "Floor", "physics.floor", false),
      range("floorY", "Floor Y", "physics.floor.y", [0.3, 1, 0.01], 1, { when: ["floor", true] }),
      range("floorBounce", "Bounce", "physics.floor.bounce", [0, 1, 0.05], 0.35, {
        when: ["floor", true],
      }),
      range("floorFriction", "Friction", "physics.floor.friction", [0, 1, 0.05], 0.4, {
        when: ["floor", true],
      }),
    ],
  },
  {
    id: "hooks",
    title: "Hooks",
    icon: "⚡",
    description: "Lifecycle callbacks feed the counters in the top bar.",
    controls: [
      toggle("hookStart", "On Start", "onStart", true),
      toggle("hookSpawn", "On Particle Spawn", "onParticleSpawn", true),
      toggle("hookUpdate", "On Particle Update", "onParticleUpdate", false, {
        hint: "Runs per particle per frame.",
      }),
      toggle("rainbow", "Rainbow Recolor", "onParticleUpdate → p.frontColor", false, {
        hint: "Mutates frontColor from the particle age inside onParticleUpdate.",
        when: ["hookUpdate", true],
      }),
      toggle("hookDeath", "On Particle Death", "onParticleDeath", true),
      toggle("hookComplete", "On Complete", "onComplete", true),
      toggle("logEvents", "Log to Console", "console.log", false),
    ],
  },
];
