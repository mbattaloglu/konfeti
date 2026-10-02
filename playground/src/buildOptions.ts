import type {
  AttractOptions,
  BuiltinPhysicsOptions,
  BuiltinShapeOptions,
  FireInput,
  FireOptions,
  FloorOptions,
  FormationOptions,
  ImageInput,
  OriginPoint,
  PaperStyle,
  SwirlOptions,
} from "konfeti";

import type { ControlState, NumberPair } from "./controlTypes";
import { DEMO_SVG } from "./demoAssets";
import type { DemoAssets } from "./demoAssets";
import {
  BITMAP_DEFAULTS,
  DEFAULT_ATTRACT,
  DEFAULT_FIRE_OPTIONS,
  DEFAULT_FLOOR,
  DEFAULT_FORMATION,
  DEFAULT_FORMATION_FONT,
  DEFAULT_FORMATION_RELEASE_VELOCITY,
  DEFAULT_IMAGE_COLORS,
  DEFAULT_ORIGIN,
  DEFAULT_PHYSICS,
  DEFAULT_SHAPE_WEIGHT,
  DEFAULT_SWIRL,
  VECTOR_DEFAULTS,
} from "./editor/libraryDefaults";
import { rangeOf, sameDeep, toPair } from "./editor/optionValues";
import {
  diffStyle,
  explicitStyle,
  GEOMETRY_GROUPS,
  handlerStyleKeys,
  inheritedStyle,
  libraryStyle,
  STYLE_GROUPS,
  STYLE_KEYS,
} from "./editor/styleModel";
import type { OptionValue, StyleKey } from "./editor/styleModel";
import { bool, list, num, pair, raw, splitList, str } from "./stateReaders";

/**
 * Builder Mode.
 * "minimal" sends only what differs from the library defaults, "explicit" writes everything out.
 */
export type BuildMode = "minimal" | "explicit";

/**
 * Build Switches.
 */
export type BuildSettings = {
  /**
   * Builder Mode.
   *
   * @defaultValue "minimal"
   */
  readonly mode?: BuildMode;
  /**
   * Send the Origin.
   * False for Click to Fire and the Pointer Stream, which place the burst themselves.
   *
   * @defaultValue true
   */
  readonly includeOrigin?: boolean;
  /**
   * Send the Formation.
   * False for the Pointer Stream, which cannot form a shape.
   *
   * @defaultValue true
   */
  readonly includeFormation?: boolean;
};

/**
 * Every Key of an Option Type (of each member, for a union such as the shape entries).
 *
 * @typeParam T - Library Option Type
 */
type AnyKey<T> = T extends unknown ? keyof T & string : never;

/**
 * Option Object under Construction.
 * Its keys are checked against the library option type, so a misspelled key does not compile; the values stay
 * unknown, because they come from the style model's option forms (pinned by the builder tests).
 *
 * @typeParam T - Library Option Type the Draft Becomes
 */
type Draft<T> = Partial<Record<AnyKey<T>, unknown>>;

/**
 * Writes Option Values into a Draft, Leaving Out Library Defaults in Minimal Mode.
 *
 * @typeParam K - Keys of the Draft
 */
type Writer<K extends string> = {
  /**
   * Write a Number Unless It Equals Its Default (minimal mode).
   */
  readonly number: (key: K, value: number, fallback: number) => void;
  /**
   * Write a Span as a Range Unless It Equals Its Default Pair (minimal mode).
   */
  readonly span: (key: K, value: NumberPair, fallback: NumberPair) => void;
  /**
   * Write a Value Unless It Equals Its Default Structurally (minimal mode).
   */
  readonly value: (key: K, value: OptionValue, fallback: OptionValue) => void;
};

/**
 * Sub-Key of a Physics Toggle Object: Key, Value and Library Default, Both in Option Form.
 *
 * @typeParam T - Options of the Toggle Object (swirl, floor, attract)
 */
type ToggleField<T> = readonly [key: AnyKey<T>, value: OptionValue, fallback: OptionValue];

/**
 * Shape Cards in the Order the Builder Writes Them, with the Shape Type Each One Sends.
 */
const CARD_TYPES = [
  ["paper", "paper"],
  ["star", "star"],
  ["triangle", "triangle"],
  ["polygon", "polygon"],
  ["heart", "heart"],
  ["ribbon", "ribbon"],
  ["path", "path"],
  ["emoji", "emoji"],
  ["text", "text"],
  ["image", "image"],
  ["sprite", "spritesheet"],
] as const;

/**
 * Library Default Size of Every Card That Sends `size` (ribbon sends `length`, paper neither).
 */
const CARD_SIZES: Readonly<Record<string, readonly [number, number]>> = {
  star: VECTOR_DEFAULTS.starSize,
  triangle: VECTOR_DEFAULTS.triangleSize,
  polygon: VECTOR_DEFAULTS.polygonSize,
  heart: VECTOR_DEFAULTS.heartSize,
  path: VECTOR_DEFAULTS.pathSize,
  emoji: BITMAP_DEFAULTS.emojiSize,
  text: BITMAP_DEFAULTS.textSize,
  image: BITMAP_DEFAULTS.imageSize,
  sprite: BITMAP_DEFAULTS.spriteSize,
};

/**
 * Rows of the Demo Sprite Sheet (its frames sit in one row).
 */
const DEMO_SHEET_ROWS = 1;

/**
 * Formation Text Used When the Text Field Is Blank (the library throws on a blank text).
 */
const FALLBACK_FORMATION_TEXT = "KONFETI";

/**
 * A Typed Backslash + n (the text input is single-line, so this starts a new line).
 */
const TYPED_NEWLINE = /\\n/g;

/**
 * Create a Writer for a Draft.
 *
 * @typeParam K - Keys of the Draft
 * @param draft - Option Object to Write Into
 * @param explicit - Write Every Value (explicit mode)
 * @returns Writer
 */
function writerFor<K extends string>(
  draft: Partial<Record<K, unknown>>,
  explicit: boolean,
): Writer<K> {
  const write = (key: K, value: unknown, isDefault: boolean): void => {
    if (explicit || !isDefault) {
      draft[key] = value;
    }
  };

  return {
    number: (key, value, fallback) => {
      write(key, value, value === fallback);
    },
    span: (key, value, fallback) => {
      write(key, rangeOf(value), sameDeep(value, fallback));
    },
    value: (key, value, fallback) => {
      write(key, value, sameDeep(value, fallback));
    },
  };
}

/**
 * Check Whether a Draft Holds Any Key.
 *
 * @param draft - Option Object
 * @returns Non-Empty Flag
 */
function hasKeys(draft: object): boolean {
  return Object.keys(draft).length > 0;
}

/**
 * Collapse a List to a Single Value When It Has One Entry.
 *
 * @param values - Entries
 * @returns Single Entry or the List
 */
function oneOrList(values: readonly string[]): string | readonly string[] {
  const [first] = values;

  return values.length === 1 && first !== undefined ? first : values;
}

/**
 * Build the Origin (only the axes that differ in minimal mode).
 *
 * @param state - Burst State
 * @param explicit - Explicit Mode
 * @returns Origin Options (empty when both axes are at their defaults)
 */
function buildOrigin(state: Readonly<ControlState>, explicit: boolean): Draft<OriginPoint> {
  const origin: Draft<OriginPoint> = {};
  const write = writerFor(origin, explicit);
  // an origin point that leaves out an axis uses that axis' default, so a partial origin is exact
  write.span("x", pair(state, "originX"), toPair(DEFAULT_ORIGIN.x));
  write.span("y", pair(state, "originY"), toPair(DEFAULT_ORIGIN.y));

  return origin;
}

/**
 * Build Emission Options.
 *
 * @param state - Burst State
 * @returns Emission Options (the library default for burst mode)
 */
function buildEmission(state: Readonly<ControlState>): OptionValue {
  switch (str(state, "emissionMode")) {
    case "stream":
      return { mode: "stream", duration: num(state, "streamDuration") };
    case "interval":
      return {
        mode: "interval",
        every: num(state, "intervalEvery"),
        times: num(state, "intervalTimes"),
      };
    default:
      return { ...DEFAULT_FIRE_OPTIONS.emission };
  }
}

/**
 * Build the Base Paper Style and Geometry (inherited by every shape).
 *
 * @param state - Burst State
 * @param explicit - Explicit Mode
 * @returns Paper Options (minimal: only what differs from the library defaults)
 */
function buildPaper(state: Readonly<ControlState>, explicit: boolean): Draft<PaperStyle> {
  const paper: Draft<PaperStyle> = {};

  for (const group of GEOMETRY_GROUPS) {
    const full = group.read(state, "");

    // the library has no default aspect ratio: it is sent while Use Aspect Ratio is on, in both modes
    if (group.key === "aspectRatio") {
      if (bool(state, "useAspect")) {
        paper[group.key] = group.emit(full, explicit);
      }
    } else if (explicit || group.fallback === null || !group.same(full, group.fallback)) {
      paper[group.key] = group.emit(full, explicit);
    }
  }

  for (const group of STYLE_GROUPS) {
    const full = group.read(state, "");
    const value = explicit
      ? explicitStyle(full)
      : diffStyle(group.key, full, libraryStyle(group.key));

    if (value !== undefined) {
      paper[group.key] = value;
    }
  }

  return paper;
}

/**
 * Pick the Image Card's Source.
 *
 * @param state - Burst State
 * @param assets - Demo Assets
 * @returns Image Source
 */
function imageSource(state: Readonly<ControlState>, assets: DemoAssets): ImageInput {
  const upload = raw(state, "image.upload");

  switch (str(state, "image.src")) {
    case "upload":
      // an upload card without a file shows the demo canvas
      return upload === "" ? assets.coinCanvas : upload;
    case "demo url":
      return assets.coinUrl;
    case "inline svg":
      return DEMO_SVG;
    default:
      return assets.coinCanvas;
  }
}

/**
 * Pick the Formation Image.
 *
 * @param state - Burst State
 * @param assets - Demo Assets
 * @returns Formation Image (the demo logo unless a file is uploaded)
 */
function formationImage(state: Readonly<ControlState>, assets: DemoAssets): ImageInput {
  const upload = raw(state, "formationUpload");

  return str(state, "formationImage") === "upload" && upload !== "" ? upload : assets.logoCanvas;
}

/**
 * Turn a Font Weight Option into Its Option Value.
 *
 * @param option - Selected Option (`"100"` … `"900"`, `"normal"`, `"bold"`)
 * @returns A Number for the Numeric Options, the CSS Keyword Otherwise
 */
function fontWeightOf(option: string): number | string {
  const weight = Number(option);

  return option.trim() !== "" && Number.isFinite(weight) ? weight : option;
}

/**
 * Write a Font Family Exactly as Typed (a blank one leaves the library default).
 *
 * @param write - Entry Writer
 * @param family - Typed Font Family
 * @param fallback - Library Default Font Family
 */
function writeFontFamily(
  write: Writer<AnyKey<BuiltinShapeOptions>>,
  family: string,
  fallback: string,
): void {
  if (family.trim() !== "") {
    write.value("fontFamily", family, fallback);
  }
}

/**
 * Build the Shape-Specific Part of One Card's Entry.
 *
 * @param prefix - Card Prefix
 * @param entry - Entry under Construction (type, weight and size already written)
 * @param state - Burst State
 * @param assets - Demo Assets
 * @param explicit - Explicit Mode
 * @returns False When the Card Has No Content to Send (the entry is dropped)
 */
function buildContent(
  prefix: (typeof CARD_TYPES)[number][0],
  entry: Draft<BuiltinShapeOptions>,
  state: Readonly<ControlState>,
  assets: DemoAssets,
  explicit: boolean,
): boolean {
  const write = writerFor(entry, explicit);

  switch (prefix) {
    case "paper":
    case "triangle":
    case "heart":
      return true;
    case "star":
      write.span("points", pair(state, "star.points"), toPair(VECTOR_DEFAULTS.starPoints));
      write.number("innerRatio", num(state, "star.innerRatio"), VECTOR_DEFAULTS.starInnerRatio);
      return true;
    case "polygon":
      write.span("sides", pair(state, "polygon.sides"), toPair(VECTOR_DEFAULTS.polygonSides));
      return true;
    case "ribbon":
      write.span("length", pair(state, "ribbon.length"), toPair(VECTOR_DEFAULTS.ribbonLength));
      write.number("thickness", num(state, "ribbon.thickness"), VECTOR_DEFAULTS.ribbonThickness);
      write.number("waves", num(state, "ribbon.waves"), VECTOR_DEFAULTS.ribbonWaves);
      return true;
    case "path": {
      const path = raw(state, "path.d");

      // a blank path has nothing to draw
      if (path.trim() === "") {
        return false;
      }

      entry.path = path;
      write.value(
        "viewBox",
        [num(state, "path.viewBox"), num(state, "path.viewBoxHeight")],
        VECTOR_DEFAULTS.pathViewBox,
      );
      return true;
    }
    case "emoji": {
      const emoji = splitList(raw(state, "emoji.list"));

      if (emoji.length === 0) {
        return false;
      }

      entry.emoji = oneOrList(emoji);
      writeFontFamily(write, raw(state, "emoji.fontFamily"), BITMAP_DEFAULTS.emojiFontFamily);
      return true;
    }
    case "text": {
      const words = splitList(raw(state, "text.list"));

      if (words.length === 0) {
        return false;
      }

      entry.text = oneOrList(words);
      writeFontFamily(write, raw(state, "text.fontFamily"), BITMAP_DEFAULTS.textFontFamily);
      write.value(
        "fontWeight",
        fontWeightOf(str(state, "text.fontWeight")),
        BITMAP_DEFAULTS.textFontWeight,
      );
      return true;
    }
    case "image":
      entry.src = imageSource(state, assets);
      return true;
    case "sprite":
      entry.src = str(state, "sprite.src") === "demo url" ? assets.sheetUrl : assets.sheetCanvas;
      entry.frames = { cols: assets.sheetFrames, rows: DEMO_SHEET_ROWS };
      write.span("fps", pair(state, "sprite.fps"), toPair(BITMAP_DEFAULTS.spriteFps));
      write.value("loop", bool(state, "sprite.loop"), BITMAP_DEFAULTS.spriteLoop);
      write.value(
        "randomStartFrame",
        bool(state, "sprite.randomStart"),
        BITMAP_DEFAULTS.spriteRandomStartFrame,
      );
      return true;
  }
}

/**
 * Collect the Style Keys One Card's Entry Sends, by Key.
 *
 * @param prefix - Card Prefix
 * @param type - Shape Type
 * @param state - Burst State
 * @param explicit - Explicit Mode
 * @param minimalPaper - Base Paper as the Minimal Builder Sends It
 * @returns Option Value by Style Key
 */
function entryStyles(
  prefix: string,
  type: string,
  state: Readonly<ControlState>,
  explicit: boolean,
  minimalPaper: Draft<PaperStyle>,
): ReadonlyMap<StyleKey, OptionValue> {
  const styles = new Map<StyleKey, OptionValue>();
  // the star and heart cards' own palettes: an empty one inherits paper.colors
  const colors = list(state, `${prefix}.colors`);

  if (colors.length > 0) {
    styles.set("colors", [...colors]);
  }

  // the explicit base paper would replace the handler's own defaults (no flip for emoji …), so the entry writes
  // what the shape gets in minimal mode
  if (explicit) {
    for (const key of handlerStyleKeys(type)) {
      if (!styles.has(key)) {
        styles.set(key, explicitStyle(inheritedStyle(key, type, minimalPaper)));
      }
    }
  }

  return styles;
}

/**
 * Build the Weighted Shape Mix from the Enabled Cards.
 *
 * @param state - Burst State
 * @param assets - Demo Assets
 * @param explicit - Explicit Mode
 * @param minimalPaper - Base Paper as the Minimal Builder Sends It
 * @returns Shape Entries in Card Order (empty: the library's paper-only default)
 */
function buildShapes(
  state: Readonly<ControlState>,
  assets: DemoAssets,
  explicit: boolean,
  minimalPaper: Draft<PaperStyle>,
): Draft<BuiltinShapeOptions>[] {
  const entries: Draft<BuiltinShapeOptions>[] = [];

  for (const [prefix, type] of CARD_TYPES) {
    if (!bool(state, `${prefix}.enabled`)) {
      continue;
    }

    const entry: Draft<BuiltinShapeOptions> = { type };
    const write = writerFor(entry, explicit);
    const size = CARD_SIZES[prefix];
    write.number("weight", num(state, `${prefix}.weight`), DEFAULT_SHAPE_WEIGHT);

    if (size !== undefined) {
      write.span("size", pair(state, `${prefix}.size`), toPair(size));
    }

    if (!buildContent(prefix, entry, state, assets, explicit)) {
      continue;
    }

    const styles = entryStyles(prefix, type, state, explicit, minimalPaper);

    for (const key of STYLE_KEYS) {
      const value = styles.get(key);

      if (value !== undefined) {
        entry[key] = value;
      }
    }

    entries.push(entry);
  }

  return entries;
}

/**
 * Write a Physics Toggle: off → nothing (`false` when explicit); on → the differing sub-keys, or `true`.
 *
 * @typeParam T - Options of the Toggle Object (their keys are the allowed sub-keys)
 * @param physics - Physics Options under Construction
 * @param key - Toggle Key
 * @param on - Toggle State
 * @param fields - Sub-Keys with Their Values and Library Defaults
 * @param explicit - Explicit Mode (every sub-key)
 */
function writeToggle<T>(
  physics: Draft<BuiltinPhysicsOptions>,
  key: "swirl" | "floor" | "attract",
  on: boolean,
  fields: readonly ToggleField<T>[],
  explicit: boolean,
): void {
  if (!on) {
    if (explicit) {
      physics[key] = false;
    }

    return;
  }

  const sent = fields.filter(([, value, fallback]) => explicit || !sameDeep(value, fallback));

  physics[key] =
    sent.length > 0 ? Object.fromEntries(sent.map(([sub, value]) => [sub, value])) : true;
}

/**
 * Build Physics Options.
 *
 * @param state - Burst State
 * @param explicit - Explicit Mode
 * @returns Physics Options (minimal: only what differs from the library defaults)
 */
function buildPhysics(
  state: Readonly<ControlState>,
  explicit: boolean,
): Draft<BuiltinPhysicsOptions> {
  const physics: Draft<BuiltinPhysicsOptions> = {};
  const write = writerFor(physics, explicit);
  write.span("gravity", pair(state, "gravity"), toPair(DEFAULT_PHYSICS.gravity));
  write.span("drag", pair(state, "drag"), toPair(DEFAULT_PHYSICS.drag));
  write.span("wind", pair(state, "wind"), toPair(DEFAULT_PHYSICS.wind));

  if (bool(state, "useTerminal")) {
    physics.terminalVelocity = num(state, "terminalVelocity");
  } else if (explicit) {
    physics.terminalVelocity = DEFAULT_PHYSICS.terminalVelocity;
  }

  writeToggle<SwirlOptions>(
    physics,
    "swirl",
    bool(state, "swirl"),
    [
      ["strength", rangeOf(pair(state, "swirlStrength")), rangeOf(toPair(DEFAULT_SWIRL.strength))],
      [
        "frequency",
        rangeOf(pair(state, "swirlFrequency")),
        rangeOf(toPair(DEFAULT_SWIRL.frequency)),
      ],
    ],
    explicit,
  );
  writeToggle<FloorOptions>(
    physics,
    "floor",
    bool(state, "floor"),
    [
      ["y", num(state, "floorY"), DEFAULT_FLOOR.y],
      ["bounce", num(state, "floorBounce"), DEFAULT_FLOOR.bounce],
      ["friction", num(state, "floorFriction"), DEFAULT_FLOOR.friction],
    ],
    explicit,
  );

  const radius = num(state, "attractRadius");
  writeToggle<AttractOptions>(
    physics,
    "attract",
    bool(state, "attract"),
    [
      [
        "target",
        // a point target always carries both axes
        str(state, "attractTarget") === "point"
          ? { x: rangeOf(pair(state, "attractX")), y: rangeOf(pair(state, "attractY")) }
          : "pointer",
        DEFAULT_ATTRACT.target,
      ],
      [
        "strength",
        rangeOf(pair(state, "attractStrength")),
        rangeOf(toPair(DEFAULT_ATTRACT.strength)),
      ],
      // 0 on the slider means "no limit"
      ["radius", radius > 0 ? radius : DEFAULT_ATTRACT.radius, DEFAULT_ATTRACT.radius],
      ["falloff", str(state, "attractFalloff"), DEFAULT_ATTRACT.falloff],
    ],
    explicit,
  );

  return physics;
}

/**
 * Build Formation Options.
 *
 * @param state - Burst State
 * @param assets - Demo Assets
 * @param explicit - Explicit Mode
 * @returns Formation Options
 */
function buildFormation(
  state: Readonly<ControlState>,
  assets: DemoAssets,
  explicit: boolean,
): Draft<FormationOptions> {
  const formation: Draft<FormationOptions> = {};
  const write = writerFor(formation, explicit);

  if (str(state, "formationSource") === "image") {
    formation.image = formationImage(state, assets);

    if (bool(state, "useFormationWidth")) {
      formation.width = num(state, "formationWidth");
    }

    write.value("imageColors", bool(state, "formationImageColors"), DEFAULT_IMAGE_COLORS);
  } else {
    // sent exactly as typed (never trimmed); only a blank text falls back
    const text = raw(state, "formationText").replace(TYPED_NEWLINE, "\n");
    const font = raw(state, "formationFont");
    formation.text = text.trim() === "" ? FALLBACK_FORMATION_TEXT : text;

    if (font.trim() !== "") {
      write.value("font", font, DEFAULT_FORMATION_FONT);
    }
  }

  const mode = str(state, "formationMode");
  write.value("mode", mode, DEFAULT_FORMATION.mode);

  // appear mode forces the fly-in to 0, so it is only sent while assembling
  if (mode !== "appear") {
    write.number("assemble", num(state, "formationAssemble"), DEFAULT_FORMATION.assemble);
  }

  write.number("hold", num(state, "formationHold"), DEFAULT_FORMATION.hold);
  // the library resolves the easing in both modes, so it is sent in both
  write.value("easing", str(state, "formationEasing"), DEFAULT_FORMATION.easing);
  write.number("spacing", num(state, "formationSpacing"), DEFAULT_FORMATION.spacing);
  write.number("fit", num(state, "formationFit"), DEFAULT_FORMATION.fit);

  return formation;
}

/**
 * Build One Burst's Fire Options from Its Control State.
 *
 * @param state - Burst State
 * @param assets - Demo Assets (canvases and URLs the sources point to)
 * @param settings - Build Switches
 * @returns Fire Options (without hooks)
 */
export function buildBurst(
  state: Readonly<ControlState>,
  assets: DemoAssets,
  settings: BuildSettings = {},
): FireOptions {
  const explicit = settings.mode === "explicit";
  const formation = settings.includeFormation !== false && bool(state, "formation");
  const options: Draft<FireOptions> = {};
  const write = writerFor(options, explicit);

  if (!formation) {
    write.number("particleCount", num(state, "particleCount"), DEFAULT_FIRE_OPTIONS.particleCount);
  } else if (bool(state, "useFormationCap")) {
    // under a formation an explicit count is the cap, so it is sent whenever the cap is on (60 included)
    options.particleCount = num(state, "particleCount");
  }

  write.span("angle", pair(state, "angle"), toPair(DEFAULT_FIRE_OPTIONS.angle));
  write.number("spread", num(state, "spread"), DEFAULT_FIRE_OPTIONS.spread);
  write.span(
    "startVelocity",
    pair(state, formation ? "formationVelocity" : "velocity"),
    toPair(formation ? DEFAULT_FORMATION_RELEASE_VELOCITY : DEFAULT_FIRE_OPTIONS.startVelocity),
  );
  write.span("lifetime", pair(state, "lifetime"), toPair(DEFAULT_FIRE_OPTIONS.lifetime));

  if (settings.includeOrigin !== false) {
    const origin = buildOrigin(state, explicit);

    if (hasKeys(origin)) {
      options.origin = origin;
    }
  }

  // a formation needs the single burst the library defaults to
  if (!formation) {
    write.value("emission", buildEmission(state), DEFAULT_FIRE_OPTIONS.emission);
  }

  write.number("delay", num(state, "delay"), DEFAULT_FIRE_OPTIONS.delay);

  // the default seed is random, so a chosen one is always sent
  if (bool(state, "useSeed")) {
    options.seed = num(state, "seed");
  }

  const paper = buildPaper(state, explicit);
  const shapes = buildShapes(state, assets, explicit, explicit ? buildPaper(state, false) : paper);
  const physics = buildPhysics(state, explicit);

  if (explicit || hasKeys(paper)) {
    options.paper = paper;
  }

  if (shapes.length > 0) {
    options.shapes = shapes;
  }

  if (explicit || hasKeys(physics)) {
    options.physics = physics;
  }

  if (formation) {
    options.formation = buildFormation(state, assets, explicit);
  }

  // the keys are checked against FireOptions; the values come from the style model's option forms, which the
  // builder tests pin key by key
  return options as FireOptions;
}

/**
 * Build the Fire Input of Every Burst.
 * One burst gives its options, several give a list in tab order.
 *
 * @param bursts - Burst States in Tab Order
 * @param assets - Demo Assets
 * @param settings - Build Switches
 * @returns Fire Input
 */
export function buildInput(
  bursts: readonly Readonly<ControlState>[],
  assets: DemoAssets,
  settings: BuildSettings = {},
): FireInput {
  const built = bursts.map((burst) => buildBurst(burst, assets, settings));
  const [first] = built;

  return built.length === 1 && first !== undefined ? first : built;
}
