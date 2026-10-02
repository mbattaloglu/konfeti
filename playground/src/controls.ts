import type {
  ChipsControl,
  ColorControl,
  ControlCard,
  ControlCondition,
  ControlSection,
  FileControl,
  NumberPair,
  PaletteControl,
  RangeControl,
  SelectControl,
  SpanControl,
  TextControl,
  ToggleControl,
  ValueDomain,
} from "./controlTypes";
import {
  BITMAP_DEFAULTS,
  DEFAULT_ATTRACT,
  DEFAULT_FADE_OUT,
  DEFAULT_FIRE_OPTIONS,
  DEFAULT_FLIP,
  DEFAULT_FLOOR,
  DEFAULT_FORMATION,
  DEFAULT_FORMATION_FONT,
  DEFAULT_FORMATION_RELEASE_VELOCITY,
  DEFAULT_GRADIENT_ANGLE,
  DEFAULT_IMAGE_COLORS,
  DEFAULT_LIFE_EASING,
  DEFAULT_ORIGIN,
  DEFAULT_PALETTE,
  DEFAULT_PAPER_GEOMETRY,
  DEFAULT_PHYSICS,
  DEFAULT_SHADOW,
  DEFAULT_SHAPE_WEIGHT,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STYLE,
  DEFAULT_SWIRL,
  DEFAULT_TRAIL,
  DEFAULT_WOBBLE,
  FORMATION_MIN_FIT,
  MAX_SKEW_DEGREES,
  OMITTED_CORNER_RADIUS,
  TRAIL_LENGTH_LIMITS,
  VECTOR_DEFAULTS,
} from "./editor/libraryDefaults";
import {
  CUSTOM_THEME,
  deriveTheme,
  PALETTE_THEMES,
  splitColor,
  toPair,
} from "./editor/optionValues";
import type { SplitColor } from "./editor/optionValues";

/**
 * Optional Control Extras (tooltip, enable condition, Advanced flag).
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
  /**
   * Advanced-Only Control.
   */
  readonly advanced?: true;
};

/**
 * Optional Slider Extras Shared by Range and Span Controls.
 */
type SliderExtra = Extra & {
  /**
   * Unit Suffix.
   */
  readonly unit?: string;
  /**
   * Accepted Values.
   */
  readonly domain?: ValueDomain;
};

/**
 * Optional Single-Thumb Slider Extras.
 */
type RangeExtra = SliderExtra & {
  /**
   * Readout Text for 0.
   */
  readonly zeroLabel?: string;
};

/**
 * Optional Dropdown Extras.
 */
type SelectExtra = Extra & {
  /**
   * Options Listed Only in Advanced Mode.
   */
  readonly advancedOptions?: readonly string[];
  /**
   * Options Only a Derived Value Selects.
   */
  readonly derivedOptions?: readonly string[];
};

/**
 * Optional Text Extras.
 */
type TextExtra = Extra & {
  /**
   * Input Placeholder.
   */
  readonly placeholder?: string;
  /**
   * Write Only on Commit.
   */
  readonly commitOn?: "change";
};

/**
 * Optional Color List Extras.
 */
type PaletteExtra = Extra & {
  /**
   * Fewest Colors.
   */
  readonly minItems?: number;
};

/**
 * Slider Bounds as `[min, max, step]`.
 */
type Bounds = readonly [min: number, max: number, step: number];

/**
 * Values the Library Accepts from Zero Up (durations, the attract radius).
 */
const AT_LEAST_ZERO: ValueDomain = { min: 0 };

/**
 * Values the Library Accepts Only Above Zero (spacings, widths, weights).
 */
const ABOVE_ZERO: ValueDomain = { min: 0, exclusive: true };

/**
 * Ratios from Zero to One (an editor-side rule for the shadow opacity).
 */
const UNIT_INTERVAL: ValueDomain = { min: 0, max: 1 };

/**
 * Shortest Interval Period the Editor Accepts, in Milliseconds.
 * The library fires every shot that is due in one loop, so a far shorter period stalls the frame.
 */
const MIN_INTERVAL_EVERY_MS = 1;

/**
 * Most Interval Shots the Editor Accepts.
 */
const MAX_INTERVAL_TIMES = 1000;

/**
 * Interval Periods from MIN_INTERVAL_EVERY_MS Up (an editor-side rule; the library only needs a period above 0).
 */
const INTERVAL_PERIOD: ValueDomain = { min: MIN_INTERVAL_EVERY_MS };

/**
 * Interval Shot Counts from One to MAX_INTERVAL_TIMES after Math.floor (the library floors them, the cap is ours).
 */
const INTERVAL_SHOTS: ValueDomain = { min: 1, floored: true, max: MAX_INTERVAL_TIMES };

/**
 * Highest Sprite Frame Rate the Editor Accepts.
 * The library advances one frame per loop step, so a far higher rate stalls or freezes the frame loop.
 */
const MAX_SPRITE_FPS = 1000;

/**
 * Sprite Frame Rates from Zero to MAX_SPRITE_FPS (an editor-side rule; the library treats a negative rate as 0).
 */
const SPRITE_FPS: ValueDomain = { min: 0, max: MAX_SPRITE_FPS };

/**
 * Largest Size, Length or Size Factor the Editor Accepts, Either Sign.
 * Keeps size × scale × aspect ratio finite: the canvas throws on a gradient across an overflowing size.
 */
const MAX_SIZE_INPUT = 1e6;

/**
 * Sizes, Lengths and Scales within ±MAX_SIZE_INPUT (an editor-side rule; the library treats negatives as 0).
 */
const SIZE_FACTOR: ValueDomain = { min: -MAX_SIZE_INPUT, max: MAX_SIZE_INPUT };

/**
 * Aspect Ratios above Zero up to MAX_SIZE_INPUT (the library needs a ratio above 0; the cap is ours).
 */
const ASPECT_RATIO: ValueDomain = { min: 0, exclusive: true, max: MAX_SIZE_INPUT };

/**
 * Path View Box Sides from 1 / MAX_SIZE_INPUT to MAX_SIZE_INPUT.
 * The library needs sides above 0; both bounds are ours, because the side ratio scales the drawn height.
 */
const VIEW_BOX_SIDE: ValueDomain = { min: 1 / MAX_SIZE_INPUT, max: MAX_SIZE_INPUT };

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
 * The Porter-Duff operators (`copy`, `destination-*`, `source-in/out/atop`) are left out: they wipe the canvas
 * when every particle draws separately.
 */
const BLEND_MODES = [
  "source-over",
  "lighter",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
  "xor",
] as const;

/**
 * Text Font Weights Offered in the Dropdown.
 * Numeric options are sent as numbers, the two CSS keywords as strings (`TextShapeOptions.fontWeight`).
 */
const FONT_WEIGHTS = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "normal",
  "bold",
] as const;

/**
 * Split the Library Default Shadow Color into the Color and Opacity Controls.
 *
 * @returns Hex Color and Opacity of `DEFAULT_SHADOW.color`
 * @throws Error when the library default has no hex form (the shadow controls could not show it)
 */
function libraryShadowColor(): SplitColor {
  const parts = splitColor(DEFAULT_SHADOW.color);

  if (parts === null) {
    throw new Error(`playground: library shadow color ${DEFAULT_SHADOW.color} has no hex form`);
  }

  return parts;
}

/**
 * Library Default Shadow Color, Split into the Shadow Color and Shadow Opacity Initials.
 */
const SHADOW_COLOR = libraryShadowColor();

/**
 * Create Slider Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param bounds - Min, Max, Step
 * @param initial - Initial Value
 * @param extra - Hint, Condition, Unit, Domain, Zero Label, Advanced Flag
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
 * Create Min–Max Slider Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param bounds - Min, Max, Step
 * @param initial - Initial Pair
 * @param extra - Hint, Condition, Unit, Domain, Advanced Flag
 * @returns Span Control
 */
function span(
  key: string,
  label: string,
  param: string,
  bounds: Bounds,
  initial: NumberPair,
  extra: SliderExtra = {},
): SpanControl {
  const [min, max, step] = bounds;

  return { kind: "span", key, label, param, min, max, step, initial, ...extra };
}

/**
 * Create Dropdown Control.
 *
 * @param key - State Key
 * @param label - Title Case Label
 * @param param - Option Path
 * @param options - Choices
 * @param initial - Initial Choice
 * @param extra - Hint, Condition, Advanced and Derived Options, Advanced Flag
 * @returns Select Control
 */
function select(
  key: string,
  label: string,
  param: string,
  options: readonly string[],
  initial: string,
  extra: SelectExtra = {},
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
 * @param extra - Hint, Condition, Advanced Flag
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
 * @param extra - Hint, Condition, Placeholder, Commit Mode, Advanced Flag
 * @returns Text Control
 */
function text(
  key: string,
  label: string,
  param: string,
  initial: string,
  extra: TextExtra = {},
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
 * @param extra - Hint, Condition, Advanced Flag
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
 * @param extra - Hint, Condition, Fewest Colors, Advanced Flag
 * @returns Palette Control
 */
function palette(
  key: string,
  label: string,
  param: string,
  initial: readonly string[],
  emptyLabel: string,
  extra: PaletteExtra = {},
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
 * @param extra - Hint, Condition, Advanced Flag
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
 * @param extra - Hint, Condition, Advanced Flag
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
 * @param prefix - Card Prefix (state key prefix)
 * @returns Weight Control
 */
function weight(prefix: string): RangeControl {
  return range(
    `${prefix}.weight`,
    "Weight",
    "shapes[].weight",
    [0.1, 10, 0.1],
    DEFAULT_SHAPE_WEIGHT,
    {
      hint: "Relative pick chance inside the shape mix.",
      domain: ABOVE_ZERO,
    },
  );
}

/**
 * Create Size Span for a Shape Card.
 *
 * @param prefix - Card Prefix (state key prefix)
 * @param initial - Library Default Size
 * @returns Size Control
 */
function size(prefix: string, initial: readonly [number, number]): SpanControl {
  return span(`${prefix}.size`, "Size", "shapes[].size", [2, 120, 1], toPair(initial), {
    unit: "px",
    domain: SIZE_FACTOR,
  });
}

/**
 * Create the Static Colors Override of a Shape Card (an empty list inherits `paper.colors`).
 *
 * @param prefix - Card Prefix (state key prefix)
 * @returns Palette Control
 */
function colorsOverride(prefix: string): PaletteControl {
  return palette(
    `${prefix}.colors`,
    "Colors Override",
    "shapes[].colors",
    [],
    "Inherit Paper Colors",
    {
      hint: "Empty = inherit paper.colors.",
      advanced: true,
    },
  );
}

/**
 * Shape Cards (one per `ShapeOptions` type, in the order the builder writes them).
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
      size("star", VECTOR_DEFAULTS.starSize),
      span(
        "star.points",
        "Points",
        "shapes[].points",
        [VECTOR_DEFAULTS.minSides, VECTOR_DEFAULTS.maxSides, 1],
        toPair(VECTOR_DEFAULTS.starPoints),
      ),
      range(
        "star.innerRatio",
        "Inner Ratio",
        "shapes[].innerRatio",
        [0.05, 1, 0.05],
        VECTOR_DEFAULTS.starInnerRatio,
        { advanced: true },
      ),
      colorsOverride("star"),
    ],
  },
  {
    title: "Triangle",
    param: '{ type: "triangle" }',
    enableKey: "triangle.enabled",
    initialEnabled: false,
    controls: [weight("triangle"), size("triangle", VECTOR_DEFAULTS.triangleSize)],
  },
  {
    title: "Polygon",
    param: '{ type: "polygon" }',
    enableKey: "polygon.enabled",
    initialEnabled: false,
    controls: [
      weight("polygon"),
      size("polygon", VECTOR_DEFAULTS.polygonSize),
      span(
        "polygon.sides",
        "Sides",
        "shapes[].sides",
        [VECTOR_DEFAULTS.minSides, VECTOR_DEFAULTS.maxSides, 1],
        toPair(VECTOR_DEFAULTS.polygonSides),
      ),
    ],
  },
  {
    title: "Heart",
    param: '{ type: "heart" }',
    enableKey: "heart.enabled",
    initialEnabled: false,
    controls: [weight("heart"), size("heart", VECTOR_DEFAULTS.heartSize), colorsOverride("heart")],
  },
  {
    title: "Ribbon",
    param: '{ type: "ribbon" }',
    enableKey: "ribbon.enabled",
    initialEnabled: false,
    controls: [
      weight("ribbon"),
      span(
        "ribbon.length",
        "Length",
        "shapes[].length",
        [6, 120, 1],
        toPair(VECTOR_DEFAULTS.ribbonLength),
        { unit: "px", domain: SIZE_FACTOR },
      ),
      range(
        "ribbon.thickness",
        "Thickness",
        "shapes[].thickness",
        [0.02, 0.5, 0.01],
        VECTOR_DEFAULTS.ribbonThickness,
        { hint: "Width as a ratio of the length.", advanced: true },
      ),
      range(
        "ribbon.waves",
        "Waves",
        "shapes[].waves",
        [1, VECTOR_DEFAULTS.maxRibbonWaves, 1],
        VECTOR_DEFAULTS.ribbonWaves,
        { advanced: true },
      ),
    ],
  },
  {
    title: "SVG Path",
    param: '{ type: "path" }',
    enableKey: "path.enabled",
    initialEnabled: false,
    controls: [
      weight("path"),
      size("path", VECTOR_DEFAULTS.pathSize),
      text("path.d", "Path Data", "shapes[].path", "M13 2 3 14h9l-1 8 10-12h-9l1-8z", {
        hint: "SVG path `d` string drawn inside the viewBox.",
      }),
      range(
        "path.viewBox",
        "View Box Width",
        "shapes[].viewBox[0]",
        [8, 128, 1],
        VECTOR_DEFAULTS.pathViewBox[0],
        {
          hint: "The path's drawing area; its longer side is scaled to Size.",
          domain: VIEW_BOX_SIDE,
          advanced: true,
        },
      ),
      range(
        "path.viewBoxHeight",
        "View Box Height",
        "shapes[].viewBox[1]",
        [8, 128, 1],
        VECTOR_DEFAULTS.pathViewBox[1],
        { domain: VIEW_BOX_SIDE, advanced: true },
      ),
    ],
  },
  {
    title: "Emoji",
    param: '{ type: "emoji" }',
    enableKey: "emoji.enabled",
    initialEnabled: false,
    controls: [
      weight("emoji"),
      size("emoji", BITMAP_DEFAULTS.emojiSize),
      text("emoji.list", "Emoji", "shapes[].emoji", "🎉, ✨, 🥳, 🎊", {
        hint: "Comma-separated list.",
      }),
      text(
        "emoji.fontFamily",
        "Font Family",
        "shapes[].fontFamily",
        BITMAP_DEFAULTS.emojiFontFamily,
        { advanced: true },
      ),
    ],
  },
  {
    title: "Text",
    param: '{ type: "text" }',
    enableKey: "text.enabled",
    initialEnabled: false,
    controls: [
      weight("text"),
      size("text", BITMAP_DEFAULTS.textSize),
      text("text.list", "Text", "shapes[].text", "YAY, WOW, +1", { hint: "Comma-separated list." }),
      text(
        "text.fontFamily",
        "Font Family",
        "shapes[].fontFamily",
        BITMAP_DEFAULTS.textFontFamily,
        { advanced: true },
      ),
      select(
        "text.fontWeight",
        "Font Weight",
        "shapes[].fontWeight",
        FONT_WEIGHTS,
        String(BITMAP_DEFAULTS.textFontWeight),
        { advanced: true },
      ),
    ],
  },
  {
    title: "Image",
    param: '{ type: "image" }',
    enableKey: "image.enabled",
    initialEnabled: false,
    controls: [
      weight("image"),
      size("image", BITMAP_DEFAULTS.imageSize),
      select(
        "image.src",
        "Source",
        "shapes[].src",
        ["demo canvas", "demo url", "inline svg", "upload"],
        "demo canvas",
        {
          hint: "Demo canvas passes the element itself; demo url a blob URL string; inline svg a <svg> markup string.",
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
      size("sprite", BITMAP_DEFAULTS.spriteSize),
      select("sprite.src", "Source", "shapes[].src", ["demo canvas", "demo url"], "demo canvas", {
        hint: "Procedural 8-frame spinning coin (one row).",
      }),
      span(
        "sprite.fps",
        "Frames Per Second",
        "shapes[].fps",
        [0, 60, 1],
        toPair(BITMAP_DEFAULTS.spriteFps),
        {
          unit: "fps",
          domain: SPRITE_FPS,
          advanced: true,
        },
      ),
      toggle("sprite.loop", "Loop", "shapes[].loop", BITMAP_DEFAULTS.spriteLoop, {
        advanced: true,
      }),
      toggle(
        "sprite.randomStart",
        "Random Start Frame",
        "shapes[].randomStartFrame",
        BITMAP_DEFAULTS.spriteRandomStartFrame,
        { advanced: true },
      ),
    ],
  },
];

/**
 * Playground Control Table.
 * Initials are the library defaults (imported from its config tables) wherever the library has one; content-only
 * controls (texts, required colors, the seed) start at an example value.
 */
export const CONTROL_SECTIONS: readonly ControlSection[] = [
  {
    id: "burst",
    title: "Burst",
    icon: "✦",
    open: true,
    controls: [
      range(
        "particleCount",
        "Particle Count",
        "particleCount",
        [1, 800, 1],
        DEFAULT_FIRE_OPTIONS.particleCount,
        {
          hint: "Particles per burst (per shot in interval mode). With a formation, Spacing decides unless Cap Particle Count is on.",
        },
      ),
      span("angle", "Angle", "angle", [-180, 360, 1], toPair(DEFAULT_FIRE_OPTIONS.angle), {
        unit: "°",
        hint: "Launch direction: 90 = straight up, 0 = right. Two values = a random direction in between.",
      }),
      range("spread", "Spread", "spread", [0, 360, 1], DEFAULT_FIRE_OPTIONS.spread, {
        unit: "°",
        hint: "Cone width around the angle.",
      }),
      span(
        "velocity",
        "Start Velocity",
        "startVelocity",
        [0, 4000, 5],
        toPair(DEFAULT_FIRE_OPTIONS.startVelocity),
        { unit: "px/s", when: ["formation", false] },
      ),
      span(
        "lifetime",
        "Lifetime",
        "lifetime",
        [100, 12000, 100],
        toPair(DEFAULT_FIRE_OPTIONS.lifetime),
        {
          unit: "ms",
          hint: "How long each particle lives; two values = a random lifetime in between.",
        },
      ),
      span("originX", "Origin X", "origin.x", [-0.1, 1.1, 0.01], toPair(DEFAULT_ORIGIN.x), {
        hint: "0 = left edge, 1 = right edge. Two values spawn along a line.",
      }),
      span("originY", "Origin Y", "origin.y", [-0.1, 1.1, 0.01], toPair(DEFAULT_ORIGIN.y), {
        hint: "0 = top edge, 1 = bottom edge; below 0 or above 1 starts off-screen.",
      }),
      toggle("useSeed", "Use Seed", "seed", false, {
        hint: "Same seed = same burst, every time.",
        advanced: true,
      }),
      range("seed", "Seed", "seed", [0, 9999, 1], 42, { when: ["useSeed", true], advanced: true }),
    ],
  },
  {
    id: "emission",
    title: "Emission",
    icon: "⏱",
    controls: [
      select(
        "emissionMode",
        "Mode",
        "emission.mode",
        ["burst", "stream", "interval"],
        DEFAULT_FIRE_OPTIONS.emission.mode,
        {
          hint: "burst = all at once, stream = spread over a duration, interval = repeated shots.",
          when: ["formation", false],
        },
      ),
      range("streamDuration", "Duration", "emission.duration", [100, 10000, 100], 2000, {
        unit: "ms",
        when: ["emissionMode", "stream"],
        domain: ABOVE_ZERO,
      }),
      range("intervalEvery", "Every", "emission.every", [10, 3000, 10], 400, {
        unit: "ms",
        when: ["emissionMode", "interval"],
        domain: INTERVAL_PERIOD,
      }),
      range("intervalTimes", "Times", "emission.times", [1, 30, 1], 5, {
        when: ["emissionMode", "interval"],
        domain: INTERVAL_SHOTS,
      }),
      range("delay", "Delay", "delay", [0, 5000, 50], DEFAULT_FIRE_OPTIONS.delay, {
        unit: "ms",
        hint: "The burst starts this long after fire(); use it to choreograph a list.",
        domain: AT_LEAST_ZERO,
        advanced: true,
      }),
    ],
  },
  {
    id: "formation",
    title: "Formation",
    icon: "◈",
    description: "Particles form a text or an image, hold it, then burst apart.",
    controls: [
      toggle("formation", "Formation", "formation", false, {
        hint: "When on, Spacing sets the particle count, Release Speed replaces Start Velocity and the emission is a single burst.",
      }),
      select(
        "formationSource",
        "Source",
        "formation.text / formation.image",
        ["text", "image"],
        "text",
        { when: ["formation", true] },
      ),
      text("formationText", "Text", "formation.text", "TEBRİKLER", {
        hint: "Type \\n for a new line.",
        when: ["formationSource", "text"],
      }),
      text("formationFont", "Font", "formation.font", DEFAULT_FORMATION_FONT, {
        hint: "CSS font shorthand: weight, size, family.",
        when: ["formationSource", "text"],
        advanced: true,
      }),
      select("formationImage", "Image", "formation.image", ["demo logo", "upload"], "demo logo", {
        when: ["formationSource", "image"],
      }),
      file("formationUpload", "Upload Image", "formation.image", "image/*", {
        hint: "Its opaque pixels become the shape.",
        when: ["formationImage", "upload"],
      }),
      toggle("useFormationWidth", "Fixed Width", "formation.width", false, {
        hint: "Off: the image keeps its own width.",
        when: ["formationSource", "image"],
        advanced: true,
      }),
      range("formationWidth", "Image Width", "formation.width", [40, 1200, 10], 420, {
        unit: "px",
        when: ["useFormationWidth", true],
        domain: ABOVE_ZERO,
        advanced: true,
      }),
      toggle(
        "formationImageColors",
        "Image Colors",
        "formation.imageColors",
        DEFAULT_IMAGE_COLORS,
        {
          hint: "Paint each particle with the color of its pixel.",
          when: ["formationSource", "image"],
          advanced: true,
        },
      ),
      select(
        "formationMode",
        "Mode",
        "formation.mode",
        ["assemble", "appear"],
        DEFAULT_FORMATION.mode,
        {
          hint: "assemble = fly in from beyond the edges, appear = show up in place.",
          when: ["formation", true],
        },
      ),
      range(
        "formationAssemble",
        "Fly-In",
        "formation.assemble",
        [0, 3000, 50],
        DEFAULT_FORMATION.assemble,
        { unit: "ms", when: ["formationMode", "assemble"], domain: AT_LEAST_ZERO, advanced: true },
      ),
      select(
        "formationEasing",
        "Fly-In Easing",
        "formation.easing",
        EASINGS,
        DEFAULT_FORMATION.easing,
        {
          hint: "Speed curve of the fly-in. Appear mode has no fly-in, so it changes nothing there.",
          when: ["formation", true],
          advanced: true,
        },
      ),
      range("formationHold", "Hold", "formation.hold", [0, 5000, 50], DEFAULT_FORMATION.hold, {
        unit: "ms",
        hint: "How long the shape stays before it bursts apart.",
        when: ["formation", true],
        domain: AT_LEAST_ZERO,
      }),
      range(
        "formationSpacing",
        "Spacing",
        "formation.spacing",
        [3, 24, 1],
        DEFAULT_FORMATION.spacing,
        {
          unit: "px",
          hint: "Distance between particles: smaller is denser and uses more particles.",
          when: ["formation", true],
          domain: ABOVE_ZERO,
        },
      ),
      range(
        "formationFit",
        "Fit",
        "formation.fit",
        [FORMATION_MIN_FIT, 1, 0.05],
        DEFAULT_FORMATION.fit,
        {
          hint: "Largest share of the canvas; a bigger formation is scaled down as a whole.",
          when: ["formation", true],
          advanced: true,
        },
      ),
      span(
        "formationVelocity",
        "Release Speed",
        "startVelocity",
        [0, 3000, 5],
        toPair(DEFAULT_FORMATION_RELEASE_VELOCITY),
        { unit: "px/s", when: ["formation", true], advanced: true },
      ),
      toggle("useFormationCap", "Cap Particle Count", "particleCount", false, {
        hint: "Use Particle Count as an upper limit; otherwise Spacing alone decides how many particles there are.",
        when: ["formation", true],
        advanced: true,
      }),
    ],
  },
  {
    id: "geometry",
    title: "Paper Geometry",
    icon: "▭",
    controls: [
      chips(
        "form",
        "Form",
        "paper.form",
        ["rect", "square", "circle", "strip", "leaf"],
        [DEFAULT_PAPER_GEOMETRY.form],
        { hint: "Pick one or more; several forms are mixed evenly." },
      ),
      span("width", "Width", "paper.width", [1, 60, 0.5], toPair(DEFAULT_PAPER_GEOMETRY.width), {
        unit: "px",
        domain: SIZE_FACTOR,
      }),
      span(
        "height",
        "Height",
        "paper.height",
        [1, 80, 0.5],
        toPair(DEFAULT_PAPER_GEOMETRY.height),
        {
          unit: "px",
          domain: SIZE_FACTOR,
        },
      ),
      toggle("useAspect", "Use Aspect Ratio", "paper.aspectRatio", false, {
        hint: "Derive height from width × ratio instead of paper.height.",
        advanced: true,
      }),
      span("aspectRatio", "Aspect Ratio", "paper.aspectRatio", [0.1, 5, 0.05], [1.6, 1.6], {
        unit: "×",
        when: ["useAspect", true],
        domain: ASPECT_RATIO,
        advanced: true,
      }),
      span(
        "cornerRadius",
        "Corner Radius",
        "paper.cornerRadius",
        [0, 20, 0.5],
        toPair(DEFAULT_PAPER_GEOMETRY.cornerRadius),
        { unit: "px", when: ["cornerPerCorner", false], advanced: true },
      ),
      toggle("cornerPerCorner", "Per Corner", "paper.cornerRadius", false, {
        hint: "Set each corner on its own (rect and square only).",
        advanced: true,
      }),
      span(
        "cornerTL",
        "Top Left",
        "paper.cornerRadius.tl",
        [0, 20, 0.5],
        toPair(OMITTED_CORNER_RADIUS),
        {
          unit: "px",
          when: ["cornerPerCorner", true],
          advanced: true,
        },
      ),
      span(
        "cornerTR",
        "Top Right",
        "paper.cornerRadius.tr",
        [0, 20, 0.5],
        toPair(OMITTED_CORNER_RADIUS),
        {
          unit: "px",
          when: ["cornerPerCorner", true],
          advanced: true,
        },
      ),
      span(
        "cornerBR",
        "Bottom Right",
        "paper.cornerRadius.br",
        [0, 20, 0.5],
        toPair(OMITTED_CORNER_RADIUS),
        { unit: "px", when: ["cornerPerCorner", true], advanced: true },
      ),
      span(
        "cornerBL",
        "Bottom Left",
        "paper.cornerRadius.bl",
        [0, 20, 0.5],
        toPair(OMITTED_CORNER_RADIUS),
        { unit: "px", when: ["cornerPerCorner", true], advanced: true },
      ),
      span(
        "skew",
        "Skew",
        "paper.skew",
        [-MAX_SKEW_DEGREES, MAX_SKEW_DEGREES, 1],
        toPair(DEFAULT_PAPER_GEOMETRY.skew),
        {
          unit: "°",
          hint: "A fixed slant per piece; two values = a random slant in between (±60° at most).",
          advanced: true,
        },
      ),
    ],
  },
  {
    id: "colors",
    title: "Colors",
    icon: "◐",
    controls: [
      select(
        "colorTheme",
        "Theme",
        "KonfetiPalettes",
        PALETTE_THEMES,
        deriveTheme(DEFAULT_PALETTE),
        {
          hint: "Fill the palette below with a built-in theme; edit it freely afterwards.",
          derivedOptions: [CUSTOM_THEME],
        },
      ),
      palette("colors", "Colors", "paper.colors", DEFAULT_PALETTE, "Library Default Palette", {
        hint: "Click a color to edit it, + to add one, × to remove.",
      }),
      select(
        "colorMode",
        "Color Mode",
        "paper.colorMode",
        ["random", "sequence"],
        DEFAULT_STYLE.colorMode,
        {
          advanced: true,
        },
      ),
      palette("backColor", "Back Color", "paper.backColor", [], "Auto · Darker Front", {
        hint: 'Empty = "auto" (front color darkened by Back Shade). Add colors to override.',
        advanced: true,
      }),
      range("backShade", "Back Shade", "paper.backShade", [0, 1, 0.05], DEFAULT_STYLE.backShade, {
        advanced: true,
      }),
      toggle("gradient", "Gradient", "paper.gradient", DEFAULT_STYLE.gradient, { advanced: true }),
      palette(
        "gradientColors",
        "Gradient Colors",
        "paper.gradient.colors",
        ["#ff5e7e", "#26ccff"],
        "Add at Least Two Colors",
        {
          hint: "Two or more stops, spread evenly from start to end.",
          when: ["gradient", true],
          minItems: 2,
          advanced: true,
        },
      ),
      range(
        "gradientAngle",
        "Gradient Angle",
        "paper.gradient.angle",
        [0, 360, 5],
        DEFAULT_GRADIENT_ANGLE,
        { unit: "°", when: ["gradient", true], advanced: true },
      ),
      toggle(
        "colorOverLife",
        "Color Over Life",
        "paper.colorOverLife",
        DEFAULT_STYLE.colorOverLife,
        {
          advanced: true,
        },
      ),
      color("colorOverLifeTo", "Target Color", "paper.colorOverLife.to", "#ffffff", {
        when: ["colorOverLife", true],
        advanced: true,
      }),
      select(
        "colorOverLifeEasing",
        "Easing",
        "paper.colorOverLife.easing",
        EASINGS,
        DEFAULT_LIFE_EASING,
        { when: ["colorOverLife", true], advanced: true },
      ),
      toggle("stroke", "Stroke", "paper.stroke", DEFAULT_STYLE.stroke, { advanced: true }),
      color("strokeColor", "Stroke Color", "paper.stroke.color", "#1c1c22", {
        when: ["stroke", true],
        advanced: true,
      }),
      span(
        "strokeWidth",
        "Stroke Width",
        "paper.stroke.width",
        [0.25, 6, 0.05],
        toPair(DEFAULT_STROKE_WIDTH),
        {
          unit: "px",
          when: ["stroke", true],
          advanced: true,
        },
      ),
      span("opacity", "Opacity", "paper.opacity", [0, 1, 0.05], toPair(DEFAULT_STYLE.opacity)),
      select("blendMode", "Blend Mode", "paper.blendMode", BLEND_MODES, DEFAULT_STYLE.blendMode),
    ],
  },
  {
    id: "motion",
    title: "Motion",
    icon: "↻",
    controls: [
      span("scale", "Scale", "paper.scale", [0.1, 5, 0.05], toPair(DEFAULT_STYLE.scale), {
        unit: "×",
        domain: SIZE_FACTOR,
      }),
      span(
        "rotation",
        "Start Rotation",
        "paper.rotation",
        [-360, 360, 5],
        toPair(DEFAULT_STYLE.rotation),
        {
          unit: "°",
          advanced: true,
        },
      ),
      span(
        "rotationSpeed",
        "Rotation Speed",
        "paper.rotationSpeed",
        [-1440, 1440, 10],
        toPair(DEFAULT_STYLE.rotationSpeed),
        { unit: "°/s", hint: "Spin in degrees per second; negative values spin the other way." },
      ),
      toggle("flip", "Flip", "paper.flip", DEFAULT_STYLE.flip),
      select("flipAxis", "Flip Axis", "paper.flip.axis", ["x", "y", "both"], DEFAULT_FLIP.axis, {
        when: ["flip", true],
        advanced: true,
      }),
      span(
        "flipFrequency",
        "Flip Frequency",
        "paper.flip.frequency",
        [0, 6, 0.05],
        toPair(DEFAULT_FLIP.frequency),
        { unit: "Hz", when: ["flip", true], advanced: true },
      ),
      toggle("wobble", "Wobble", "paper.wobble", DEFAULT_STYLE.wobble),
      span(
        "wobbleAmplitude",
        "Wobble Amplitude",
        "paper.wobble.amplitude",
        [0, 40, 0.5],
        toPair(DEFAULT_WOBBLE.amplitude),
        { unit: "px", when: ["wobble", true], advanced: true },
      ),
      span(
        "wobbleFrequency",
        "Wobble Frequency",
        "paper.wobble.frequency",
        [0, 5, 0.05],
        toPair(DEFAULT_WOBBLE.frequency),
        { unit: "Hz", when: ["wobble", true], advanced: true },
      ),
      span("tilt", "Tilt", "paper.tilt", [0, 85, 1], toPair(DEFAULT_STYLE.tilt), {
        unit: "°",
        hint: "Amplitude of a swaying lean; the sign is ignored.",
        advanced: true,
      }),
    ],
  },
  {
    id: "life",
    title: "Life & Effects",
    icon: "✧",
    controls: [
      range("fadeIn", "Fade In", "paper.fadeIn", [0, 1, 0.01], DEFAULT_STYLE.fadeIn, {
        hint: "Fraction of the lifetime spent fading in.",
        advanced: true,
      }),
      toggle("fadeOut", "Fade Out", "paper.fadeOut", DEFAULT_STYLE.fadeOut),
      range(
        "fadeStart",
        "Fade Start",
        "paper.fadeOut.start",
        [0, 1, 0.05],
        DEFAULT_FADE_OUT.start,
        {
          when: ["fadeOut", true],
          advanced: true,
        },
      ),
      select(
        "fadeEasing",
        "Fade Easing",
        "paper.fadeOut.easing",
        EASINGS,
        DEFAULT_FADE_OUT.easing,
        {
          when: ["fadeOut", true],
          advanced: true,
        },
      ),
      toggle(
        "scaleOverLife",
        "Scale Over Life",
        "paper.scaleOverLife",
        DEFAULT_STYLE.scaleOverLife,
        {
          advanced: true,
        },
      ),
      range("scaleTo", "Target Scale", "paper.scaleOverLife.to", [0, 3, 0.05], 0, {
        unit: "×",
        when: ["scaleOverLife", true],
        advanced: true,
      }),
      select(
        "scaleEasing",
        "Scale Easing",
        "paper.scaleOverLife.easing",
        EASINGS,
        DEFAULT_LIFE_EASING,
        {
          when: ["scaleOverLife", true],
          advanced: true,
        },
      ),
      toggle("shadow", "Shadow", "paper.shadow", DEFAULT_STYLE.shadow, { advanced: true }),
      color("shadowColor", "Shadow Color", "paper.shadow.color", SHADOW_COLOR.hex, {
        when: ["shadow", true],
        advanced: true,
      }),
      range(
        "shadowAlpha",
        "Shadow Opacity",
        "paper.shadow.color",
        [0, 1, 0.05],
        SHADOW_COLOR.alpha,
        {
          when: ["shadow", true],
          domain: UNIT_INTERVAL,
          advanced: true,
        },
      ),
      range("shadowBlur", "Shadow Blur", "paper.shadow.blur", [0, 30, 1], DEFAULT_SHADOW.blur, {
        unit: "px",
        when: ["shadow", true],
        advanced: true,
      }),
      range(
        "shadowX",
        "Shadow Offset X",
        "paper.shadow.offsetX",
        [-20, 20, 1],
        DEFAULT_SHADOW.offsetX,
        {
          unit: "px",
          when: ["shadow", true],
          advanced: true,
        },
      ),
      range(
        "shadowY",
        "Shadow Offset Y",
        "paper.shadow.offsetY",
        [-20, 20, 1],
        DEFAULT_SHADOW.offsetY,
        {
          unit: "px",
          when: ["shadow", true],
          advanced: true,
        },
      ),
      range("shine", "Shine", "paper.shine", [0, 1, 0.05], DEFAULT_STYLE.shine, {
        hint: "Glossy highlight that sweeps as the particle turns.",
      }),
      toggle("trail", "Trail", "paper.trail", DEFAULT_STYLE.trail, {
        hint: "A streak behind each particle that thins and fades toward the tail.",
      }),
      range(
        "trailLength",
        "Trail Length",
        "paper.trail.length",
        [TRAIL_LENGTH_LIMITS[0], TRAIL_LENGTH_LIMITS[1], 1],
        DEFAULT_TRAIL.length,
        { hint: "Recent positions (one per frame) the trail runs through.", when: ["trail", true] },
      ),
      span(
        "trailWidth",
        "Trail Width",
        "paper.trail.width",
        [0.5, 12, 0.25],
        toPair(DEFAULT_TRAIL.width),
        {
          unit: "px",
          when: ["trail", true],
          advanced: true,
        },
      ),
      range(
        "trailOpacity",
        "Trail Opacity",
        "paper.trail.opacity",
        [0, 1, 0.05],
        DEFAULT_TRAIL.opacity,
        {
          when: ["trail", true],
          advanced: true,
        },
      ),
      toggle("trailCustomColor", "Custom Trail Color", "paper.trail.color", false, {
        hint: "Off: every trail takes its particle's color.",
        when: ["trail", true],
        advanced: true,
      }),
      color("trailColor", "Trail Color", "paper.trail.color", "#ffd000", {
        when: ["trailCustomColor", true],
        advanced: true,
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
      span(
        "gravity",
        "Gravity",
        "physics.gravity",
        [-1500, 3000, 1],
        toPair(DEFAULT_PHYSICS.gravity),
        {
          unit: "px/s²",
        },
      ),
      span("drag", "Drag", "physics.drag", [0, 10, 0.1], toPair(DEFAULT_PHYSICS.drag), {
        unit: "/s",
      }),
      span("wind", "Wind", "physics.wind", [-1500, 1500, 1], toPair(DEFAULT_PHYSICS.wind), {
        unit: "px/s²",
      }),
      toggle("useTerminal", "Terminal Velocity", "physics.terminalVelocity", false, {
        hint: "Caps the total speed, in every direction.",
        advanced: true,
      }),
      range("terminalVelocity", "Max Speed", "physics.terminalVelocity", [50, 3000, 50], 600, {
        unit: "px/s",
        when: ["useTerminal", true],
        domain: ABOVE_ZERO,
        advanced: true,
      }),
      toggle("swirl", "Swirl", "physics.swirl", DEFAULT_PHYSICS.swirl),
      span(
        "swirlStrength",
        "Swirl Strength",
        "physics.swirl.strength",
        [0, 2000, 5],
        toPair(DEFAULT_SWIRL.strength),
        { unit: "px/s²", when: ["swirl", true], advanced: true },
      ),
      span(
        "swirlFrequency",
        "Swirl Frequency",
        "physics.swirl.frequency",
        [0, 5, 0.05],
        toPair(DEFAULT_SWIRL.frequency),
        { unit: "Hz", when: ["swirl", true], advanced: true },
      ),
      toggle("floor", "Floor", "physics.floor", DEFAULT_PHYSICS.floor),
      range("floorY", "Floor Y", "physics.floor.y", [0, 1, 0.01], DEFAULT_FLOOR.y, {
        when: ["floor", true],
        advanced: true,
      }),
      range("floorBounce", "Bounce", "physics.floor.bounce", [0, 1, 0.05], DEFAULT_FLOOR.bounce, {
        when: ["floor", true],
      }),
      range(
        "floorFriction",
        "Friction",
        "physics.floor.friction",
        [0, 1, 0.05],
        DEFAULT_FLOOR.friction,
        {
          when: ["floor", true],
          advanced: true,
        },
      ),
      toggle("attract", "Attract", "physics.attract", DEFAULT_PHYSICS.attract, {
        hint: "Pull particles toward a target; a negative strength pushes them away.",
      }),
      select(
        "attractTarget",
        "Target",
        "physics.attract.target",
        ["pointer", "point"],
        DEFAULT_ATTRACT.target,
        { when: ["attract", true], advanced: true },
      ),
      span("attractX", "Target X", "physics.attract.target.x", [-0.1, 1.1, 0.01], [0.5, 0.5], {
        hint: "A range is allowed; the pull aims at its middle.",
        when: ["attractTarget", "point"],
        advanced: true,
      }),
      span("attractY", "Target Y", "physics.attract.target.y", [-0.1, 1.1, 0.01], [0.5, 0.5], {
        when: ["attractTarget", "point"],
        advanced: true,
      }),
      span(
        "attractStrength",
        "Strength",
        "physics.attract.strength",
        [-4000, 4000, 50],
        toPair(DEFAULT_ATTRACT.strength),
        {
          unit: "px/s²",
          hint: "Negative values push particles away (a repulsor).",
          when: ["attract", true],
        },
      ),
      range("attractRadius", "Radius", "physics.attract.radius", [0, 1500, 10], 0, {
        unit: "px",
        hint: "How far the pull reaches. 0 = the whole canvas.",
        when: ["attract", true],
        zeroLabel: "∞",
        domain: AT_LEAST_ZERO,
        advanced: true,
      }),
      select(
        "attractFalloff",
        "Falloff",
        "physics.attract.falloff",
        ["constant", "linear"],
        DEFAULT_ATTRACT.falloff,
        {
          hint: "Linear: full pull at the target, none at the radius.",
          when: ["attract", true],
          advanced: true,
        },
      ),
    ],
  },
  {
    id: "hooks",
    title: "Hooks",
    icon: "⚡",
    description: "Lifecycle callbacks feed the counters in the top bar.",
    global: true,
    advanced: true,
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
