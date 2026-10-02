import {
  emojiShape,
  heartShape,
  imageShape,
  paperShape,
  pathShape,
  polygonShape,
  ribbonShape,
  spritesheetShape,
  starShape,
  textShape,
  triangleShape,
} from "konfeti";
import type { ShapeStyle } from "konfeti";

import type { ControlState, NumberPair } from "../controlTypes";
import { bool, list, num, pair, str } from "../stateReaders";
import {
  DEFAULT_FADE_OUT,
  DEFAULT_FLIP,
  DEFAULT_GRADIENT_ANGLE,
  DEFAULT_LIFE_EASING,
  DEFAULT_PALETTE,
  DEFAULT_PAPER_GEOMETRY,
  DEFAULT_SHADOW,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STYLE,
  DEFAULT_TRAIL,
  DEFAULT_WOBBLE,
  OMITTED_CORNER_RADIUS,
} from "./libraryDefaults";
import {
  asList,
  composeColor,
  hexOf,
  isFiniteNumber,
  isNumberPair,
  isRecord,
  pairOf,
  rangeOf,
  sameDeep,
  splitColor,
  toPair,
} from "./optionValues";

/**
 * Style Key (one `ShapeStyle` key, one style group).
 */
export type StyleKey = keyof typeof DEFAULT_STYLE;

/**
 * Paper Geometry Key (one `PaperGeometry` key, one geometry group).
 */
export type GeometryKey = "form" | "width" | "height" | "aspectRatio" | "cornerRadius" | "skew";

/**
 * One Part of a Full Value: a number, a string, a number pair or a string list.
 */
export type StylePart = number | string | NumberPair | readonly string[];

/**
 * Full Value of a Group That Is On (whole and merge kinds, per-corner radii): every sub-key.
 */
export type StyleObject = Readonly<Record<string, StylePart>>;

/**
 * Full Value of a Group: exactly what a shape gets for the key (`false` for an effect that is off).
 */
export type StyleFull = StylePart | false | StyleObject;

/**
 * Option Value Written into Fire Options.
 */
export type OptionValue =
  number | string | boolean | readonly OptionValue[] | { readonly [key: string]: OptionValue };

/**
 * Reads One Full Value from Control State.
 * The prefix is `""` for the base `paper.*` controls (and `"<card>."` for a card's own keys).
 */
type GroupReader<T extends StyleFull> = (state: Readonly<ControlState>, prefix: string) => T;

/**
 * Reads an Option Value into Its Full Form (null when the option form cannot be represented).
 */
type PartReader = (value: unknown) => StylePart | null;

/**
 * Plain Style Group: the highest layer wins.
 */
type PlainGroup = {
  /**
   * Group Kind.
   */
  readonly kind: "plain";
  /**
   * Style Key.
   */
  readonly key: StyleKey;
  /**
   * Base Control Keys.
   */
  readonly controls: readonly string[];
  /**
   * Read the Full Value from Control State.
   */
  readonly read: GroupReader<StylePart>;
  /**
   * Read an Option Value into Its Full Form.
   */
  readonly normalize: PartReader;
};

/**
 * Whole Style Group: `false` or an object, replaced as a whole.
 */
type WholeGroup = {
  /**
   * Group Kind.
   */
  readonly kind: "whole";
  /**
   * Style Key.
   */
  readonly key: StyleKey;
  /**
   * Base Control Keys (the toggle first).
   */
  readonly controls: readonly string[];
  /**
   * Read the Full Value from Control State.
   */
  readonly read: GroupReader<StyleObject | false>;
  /**
   * Read an Option Value into Its Full Form.
   */
  readonly normalize: (value: unknown) => StyleObject | false | null;
  /**
   * Values the Resolver Uses for Omitted Sub-Keys (left out of the minimal form).
   */
  readonly fallbacks: StyleObject;
};

/**
 * Merge Style Group: `true`, `false` or a partial object merged over the earlier layers.
 */
type MergeGroup = {
  /**
   * Group Kind.
   */
  readonly kind: "merge";
  /**
   * Style Key.
   */
  readonly key: StyleKey;
  /**
   * Base Control Keys (the toggle first).
   */
  readonly controls: readonly string[];
  /**
   * Read the Full Value from Control State.
   */
  readonly read: GroupReader<StyleObject | false>;
  /**
   * Readers of Each Sub-Key's Option Value.
   */
  readonly parts: Readonly<Record<string, PartReader>>;
  /**
   * Library Defaults the Resolver Merges Over (`DEFAULT_FLIP` …), in Full Form.
   */
  readonly defaults: StyleObject;
  /**
   * Send `{}` Instead of `true` (shadow: its option type has no `true`).
   */
  readonly emptyWhenOn: boolean;
};

/**
 * Style Group of One `ShapeStyle` Key, by How the Resolver Layers It.
 * "plain" takes the highest layer, "whole" replaces the value as a whole, "merge" merges objects key by key.
 */
export type StyleGroup = PlainGroup | WholeGroup | MergeGroup;

/**
 * Geometry Group of One `PaperGeometry` Key.
 */
export type GeometryGroup = {
  /**
   * Geometry Key.
   */
  readonly key: GeometryKey;
  /**
   * Base Control Keys.
   */
  readonly controls: readonly string[];
  /**
   * Read the Full Value from Control State.
   */
  readonly read: GroupReader<StyleFull>;
  /**
   * Library Default in Full Form, or Null when the Library Has None (aspect ratio).
   */
  readonly fallback: StyleFull | null;
  /**
   * Compare Two Full Values the Way the Resolver Reads Them.
   */
  readonly same: (a: StyleFull, b: StyleFull) => boolean;
  /**
   * Write a Full Value in Its Option Form.
   */
  readonly emit: (full: StyleFull, explicit: boolean) => OptionValue;
};

/**
 * Corner Keys of a Per-Corner Radius, in the Resolver's Order.
 */
const CORNERS = [
  ["tl", "cornerTL"],
  ["tr", "cornerTR"],
  ["br", "cornerBR"],
  ["bl", "cornerBL"],
] as const;

/**
 * Check Whether a Full Value Is an Object (every sub-key of a group that is on).
 *
 * @param full - Full Value
 * @returns Object Flag
 */
export function isStyleObject(full: StyleFull): full is StyleObject {
  return isRecord(full);
}

/**
 * Read a Finite Number Option.
 *
 * @param value - Option Value
 * @returns The Number, or Null
 */
function readNumber(value: unknown): number | null {
  return isFiniteNumber(value) ? value : null;
}

/**
 * Read a String Option.
 *
 * @param value - Option Value
 * @returns The String, or Null
 */
function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Read a Color List Option (one color or a list; hex colors only).
 *
 * @param value - Option Value
 * @returns Lowercase `#rrggbb` List, or Null for an Empty List or Any Other Color Form
 */
function readColorList(value: unknown): readonly string[] | null {
  const items = typeof value === "string" ? [value] : asList(value);

  if (items === null || items.length === 0) {
    return null;
  }

  const colors = items.map(hexOf);

  return colors.every((color): color is string => color !== null) ? colors : null;
}

/**
 * Read a Shadow Color Option (hex or `rgb()` / `rgba()`), in the Form the Editor Writes It.
 *
 * @param value - Option Value
 * @returns Composed Color, or Null
 */
function readShadowColor(value: unknown): string | null {
  const parts = splitColor(value);

  return parts === null ? null : composeColor(parts.hex, parts.alpha);
}

/**
 * Read a Trail Color Option (`"particle"` or a hex color).
 *
 * @param value - Option Value
 * @returns Trail Color, or Null
 */
function readTrailColor(value: unknown): string | null {
  return value === "particle" ? value : hexOf(value);
}

/**
 * Write One Part in Its Option Form (pairs become ranges, lists are copied).
 *
 * @param part - Full Value Part
 * @returns Option Value
 */
export function emitPart(part: StylePart): OptionValue {
  if (isNumberPair(part)) {
    return rangeOf(part);
  }

  // a copy, so built options never share a list with the state or the library defaults
  return typeof part === "object" ? [...part] : part;
}

/**
 * Write the Kept Sub-Keys of a Full Object in Their Option Form.
 *
 * @param object - Full Object
 * @param keep - Picks the Sub-Keys to Write
 * @returns Option Object
 */
function emitObject(
  object: StyleObject,
  keep: (sub: string, part: StylePart) => boolean,
): Readonly<Record<string, OptionValue>> {
  return Object.fromEntries(
    Object.entries(object)
      .filter(([sub, part]) => keep(sub, part))
      .map(([sub, part]) => [sub, emitPart(part)]),
  );
}

/**
 * Create a Plain Group Read from One Control.
 *
 * @param key - Style Key (also the control key)
 * @param read - State Reader
 * @param normalize - Option Reader
 * @returns Plain Group
 */
function plain(key: StyleKey, read: GroupReader<StylePart>, normalize: PartReader): PlainGroup {
  return { kind: "plain", key, controls: [key], read, normalize };
}

/**
 * Create a Plain Group Holding a Range (read from a span control).
 *
 * @param key - Style Key (also the control key)
 * @returns Plain Group
 */
function plainPair(key: StyleKey): PlainGroup {
  return plain(key, (state, prefix) => pair(state, prefix + key), pairOf);
}

/**
 * Create a Plain Group Holding a Number (read from a range control).
 *
 * @param key - Style Key (also the control key)
 * @returns Plain Group
 */
function plainNumber(key: StyleKey): PlainGroup {
  return plain(key, (state, prefix) => num(state, prefix + key), readNumber);
}

/**
 * Create a Plain Group Holding a Select Value.
 *
 * @param key - Style Key (also the control key)
 * @returns Plain Group
 */
function plainString(key: StyleKey): PlainGroup {
  return plain(key, (state, prefix) => str(state, prefix + key), readString);
}

/**
 * Read the Sub-Keys of a Whole or Merge Option Object.
 *
 * @param value - Option Object
 * @param parts - Sub-Key Readers
 * @param fallbacks - Values for Omitted Sub-Keys
 * @returns Full Object, or Null when a Sub-Key Is Missing or Cannot Be Represented
 */
function readObject(
  value: unknown,
  parts: Readonly<Record<string, PartReader>>,
  fallbacks: StyleObject,
): StyleObject | null {
  if (!isRecord(value)) {
    return null;
  }

  const object: Record<string, StylePart> = {};

  for (const [sub, read] of Object.entries(parts)) {
    const given = value[sub];
    const part = given === undefined ? (fallbacks[sub] ?? null) : read(given);

    if (part === null) {
      return null;
    }

    object[sub] = part;
  }

  return object;
}

/**
 * Create a Whole Group.
 *
 * @param key - Style Key (also the toggle's control key)
 * @param controls - Base Control Keys (the toggle first)
 * @param read - State Reader
 * @param parts - Sub-Key Readers (every sub-key, in option order)
 * @param fallbacks - Values the Resolver Uses for Omitted Sub-Keys
 * @returns Whole Group
 */
function whole(
  key: StyleKey,
  controls: readonly string[],
  read: GroupReader<StyleObject | false>,
  parts: Readonly<Record<string, PartReader>>,
  fallbacks: StyleObject,
): WholeGroup {
  return {
    kind: "whole",
    key,
    controls,
    read,
    // `true` has no meaning for these keys (it is not part of their option types)
    normalize: (value) => (value === false ? false : readObject(value, parts, fallbacks)),
    fallbacks,
  };
}

/**
 * Create a Merge Group.
 *
 * @param key - Style Key (also the toggle's control key)
 * @param controls - Base Control Keys (the toggle first)
 * @param read - State Reader
 * @param parts - Sub-Key Readers (every sub-key, in the library default's order)
 * @param defaults - Library Defaults Object (`DEFAULT_FLIP` …)
 * @param emptyWhenOn - Send `{}` Instead of `true`
 * @returns Merge Group
 */
function merge(
  key: StyleKey,
  controls: readonly string[],
  read: GroupReader<StyleObject | false>,
  parts: Readonly<Record<string, PartReader>>,
  defaults: Readonly<Record<string, unknown>>,
  emptyWhenOn = false,
): MergeGroup {
  const full = readObject(defaults, parts, {});

  if (full === null) {
    throw new Error(`playground: library default of "${key}" cannot be shown by the editor`);
  }

  return { kind: "merge", key, controls, read, parts, defaults: full, emptyWhenOn };
}

/**
 * Style Groups by Key, in `DEFAULT_STYLE` Order (the canonical order of style keys).
 */
const STYLE_GROUP_BY_KEY: Readonly<Record<StyleKey, StyleGroup>> = {
  scale: plainPair("scale"),
  colors: plain(
    "colors",
    (state, prefix) => {
      const colors = list(state, `${prefix}colors`);

      // an empty palette means the library default
      return colors.length > 0 ? colors : DEFAULT_PALETTE;
    },
    readColorList,
  ),
  colorMode: plainString("colorMode"),
  backColor: plain(
    "backColor",
    (state, prefix) => {
      const colors = list(state, `${prefix}backColor`);

      return colors.length > 0 ? colors : "auto";
    },
    (value) => (value === "auto" ? value : readColorList(value)),
  ),
  backShade: plainNumber("backShade"),
  gradient: whole(
    "gradient",
    ["gradient", "gradientColors", "gradientAngle"],
    (state, prefix) =>
      bool(state, `${prefix}gradient`) && {
        colors: list(state, `${prefix}gradientColors`),
        angle: num(state, `${prefix}gradientAngle`),
      },
    {
      colors: (value) => {
        const colors = readColorList(value);

        return colors !== null && colors.length >= 2 ? colors : null;
      },
      angle: readNumber,
    },
    { angle: DEFAULT_GRADIENT_ANGLE },
  ),
  colorOverLife: whole(
    "colorOverLife",
    ["colorOverLife", "colorOverLifeTo", "colorOverLifeEasing"],
    (state, prefix) =>
      bool(state, `${prefix}colorOverLife`) && {
        to: str(state, `${prefix}colorOverLifeTo`),
        easing: str(state, `${prefix}colorOverLifeEasing`),
      },
    { to: hexOf, easing: readString },
    { easing: DEFAULT_LIFE_EASING },
  ),
  stroke: whole(
    "stroke",
    ["stroke", "strokeColor", "strokeWidth"],
    (state, prefix) =>
      bool(state, `${prefix}stroke`) && {
        color: str(state, `${prefix}strokeColor`),
        width: pair(state, `${prefix}strokeWidth`),
      },
    { color: hexOf, width: pairOf },
    { width: toPair(DEFAULT_STROKE_WIDTH) },
  ),
  opacity: plainPair("opacity"),
  fadeIn: plainNumber("fadeIn"),
  fadeOut: merge(
    "fadeOut",
    ["fadeOut", "fadeStart", "fadeEasing"],
    (state, prefix) =>
      bool(state, `${prefix}fadeOut`) && {
        start: num(state, `${prefix}fadeStart`),
        easing: str(state, `${prefix}fadeEasing`),
      },
    { start: readNumber, easing: readString },
    DEFAULT_FADE_OUT,
  ),
  scaleOverLife: whole(
    "scaleOverLife",
    ["scaleOverLife", "scaleTo", "scaleEasing"],
    (state, prefix) =>
      bool(state, `${prefix}scaleOverLife`) && {
        to: num(state, `${prefix}scaleTo`),
        easing: str(state, `${prefix}scaleEasing`),
      },
    { to: readNumber, easing: readString },
    { easing: DEFAULT_LIFE_EASING },
  ),
  rotation: plainPair("rotation"),
  rotationSpeed: plainPair("rotationSpeed"),
  flip: merge(
    "flip",
    ["flip", "flipAxis", "flipFrequency"],
    (state, prefix) =>
      bool(state, `${prefix}flip`) && {
        frequency: pair(state, `${prefix}flipFrequency`),
        axis: str(state, `${prefix}flipAxis`),
      },
    { frequency: pairOf, axis: readString },
    DEFAULT_FLIP,
  ),
  wobble: merge(
    "wobble",
    ["wobble", "wobbleAmplitude", "wobbleFrequency"],
    (state, prefix) =>
      bool(state, `${prefix}wobble`) && {
        amplitude: pair(state, `${prefix}wobbleAmplitude`),
        frequency: pair(state, `${prefix}wobbleFrequency`),
      },
    { amplitude: pairOf, frequency: pairOf },
    DEFAULT_WOBBLE,
  ),
  tilt: plainPair("tilt"),
  shadow: merge(
    "shadow",
    ["shadow", "shadowColor", "shadowAlpha", "shadowBlur", "shadowX", "shadowY"],
    (state, prefix) =>
      bool(state, `${prefix}shadow`) && {
        color: composeColor(str(state, `${prefix}shadowColor`), num(state, `${prefix}shadowAlpha`)),
        blur: num(state, `${prefix}shadowBlur`),
        offsetX: num(state, `${prefix}shadowX`),
        offsetY: num(state, `${prefix}shadowY`),
      },
    { color: readShadowColor, blur: readNumber, offsetX: readNumber, offsetY: readNumber },
    DEFAULT_SHADOW,
    true,
  ),
  shine: plainNumber("shine"),
  blendMode: plainString("blendMode"),
  trail: merge(
    "trail",
    ["trail", "trailLength", "trailWidth", "trailOpacity", "trailCustomColor", "trailColor"],
    (state, prefix) =>
      bool(state, `${prefix}trail`) && {
        length: num(state, `${prefix}trailLength`),
        width: pair(state, `${prefix}trailWidth`),
        opacity: num(state, `${prefix}trailOpacity`),
        color: bool(state, `${prefix}trailCustomColor`)
          ? str(state, `${prefix}trailColor`)
          : "particle",
      },
    { length: readNumber, width: pairOf, opacity: readNumber, color: readTrailColor },
    DEFAULT_TRAIL,
  ),
};

/**
 * Every Style Group in `DEFAULT_STYLE` Order.
 */
export const STYLE_GROUPS: readonly StyleGroup[] = Object.values(STYLE_GROUP_BY_KEY);

/**
 * Every Style Key in `DEFAULT_STYLE` Order.
 */
export const STYLE_KEYS: readonly StyleKey[] = STYLE_GROUPS.map((group) => group.key);

/**
 * Compute the Value a Shape Gets for a Style Key from Option Layers, the Way the Resolver Layers Them.
 * Plain and whole keys take the highest defined layer; merge keys fold `false`, `true` and objects in order.
 *
 * @param key - Style Key
 * @param layers - Option Values, Lowest Priority First (`undefined` and `null` layers are skipped)
 * @returns Full Value, or Null when a Layer Cannot Be Represented
 */
export function effectiveStyle(key: StyleKey, layers: readonly unknown[]): StyleFull | null {
  const group = STYLE_GROUP_BY_KEY[key];

  if (group.kind !== "merge") {
    let picked: unknown;

    for (const layer of layers) {
      if (layer !== undefined && layer !== null) {
        picked = layer;
      }
    }

    return picked === undefined ? null : group.normalize(picked);
  }

  let result: StyleObject | false = group.defaults;

  for (const layer of layers) {
    if (layer === undefined || layer === null) {
      continue;
    }

    if (layer === false) {
      result = false;
      continue;
    }

    if (layer === true) {
      // `true` turns the effect back on with the defaults, or keeps what is already on
      if (result === false) {
        result = group.defaults;
      }

      continue;
    }

    if (!isRecord(layer)) {
      return null;
    }

    const next: Record<string, StylePart> = { ...(result === false ? group.defaults : result) };

    for (const [sub, value] of Object.entries(layer)) {
      const read = group.parts[sub];

      // like the resolver: undefined sub-keys are skipped, unknown ones have no effect
      if (value === undefined || read === undefined) {
        continue;
      }

      const part = read(value);

      if (part === null) {
        return null;
      }

      next[sub] = part;
    }

    result = next;
  }

  return result;
}

/**
 * Write a Full Value with Every Sub-Key (the explicit form).
 *
 * @param full - Full Value
 * @returns `false`, the Value, or an Object with Every Sub-Key
 */
export function explicitStyle(full: StyleFull): OptionValue {
  if (full === false) {
    return false;
  }

  return isStyleObject(full) ? emitObject(full, () => true) : emitPart(full);
}

/**
 * Write the Smallest Option Value That Turns an Inherited Value into a Full Value.
 * Plain and whole keys are sent whole when they differ (whole objects without the sub-keys at their fixed
 * fallback); merge keys send only the differing sub-keys, or `true` (`{}` for shadow) to turn an effect back on.
 *
 * @param key - Style Key
 * @param full - Full Value Wanted
 * @param inherited - Full Value the Shape Gets Without This Layer
 * @returns Option Value, or Undefined when Nothing Needs to Be Sent
 */
export function diffStyle(
  key: StyleKey,
  full: StyleFull,
  inherited: StyleFull,
): OptionValue | undefined {
  const group = STYLE_GROUP_BY_KEY[key];

  if (group.kind !== "merge") {
    if (sameDeep(full, inherited)) {
      return undefined;
    }

    return group.kind === "whole" && isStyleObject(full)
      ? emitObject(full, (sub, part) => !sameDeep(part, group.fallbacks[sub]))
      : explicitStyle(full);
  }

  if (full === false) {
    return inherited === false ? undefined : false;
  }

  if (!isStyleObject(full)) {
    return undefined;
  }

  const base = isStyleObject(inherited) ? inherited : group.defaults;
  const changed = emitObject(full, (sub, part) => !sameDeep(part, base[sub]));

  if (Object.keys(changed).length > 0) {
    return changed;
  }

  // nothing differs: on top of an effect that is on nothing is needed; one that is off is turned back on
  if (inherited !== false) {
    return undefined;
  }

  return group.emptyWhenOn ? {} : true;
}

/**
 * Return the Library Default of a Style Key in Full Form.
 *
 * @param key - Style Key
 * @returns Full Value
 * @throws Error when the library default cannot be shown by the editor
 */
function libraryStyleOf(key: StyleKey): StyleFull {
  const full = effectiveStyle(key, [DEFAULT_STYLE[key]]);

  if (full === null) {
    throw new Error(`playground: library default of "${key}" cannot be shown by the editor`);
  }

  return full;
}

/**
 * Library Default of Every Style Key in Full Form (`DEFAULT_STYLE`, toggles as objects).
 */
const LIBRARY_STYLE: ReadonlyMap<StyleKey, StyleFull> = new Map(
  STYLE_KEYS.map((key) => [key, libraryStyleOf(key)]),
);

/**
 * Return the Library Default of a Style Key in Full Form.
 *
 * @param key - Style Key
 * @returns Full Value
 */
export function libraryStyle(key: StyleKey): StyleFull {
  return LIBRARY_STYLE.get(key) ?? libraryStyleOf(key);
}

/**
 * Every Built-In Shape Handler (their style defaults sit between `DEFAULT_STYLE` and `paper`).
 */
const SHAPE_HANDLERS = [
  paperShape,
  starShape,
  triangleShape,
  polygonShape,
  heartShape,
  ribbonShape,
  pathShape,
  emojiShape,
  textShape,
  imageShape,
  spritesheetShape,
] as const;

/**
 * Style Defaults of the Handlers That Have Them, by Shape Type.
 */
const HANDLER_STYLES: ReadonlyMap<string, ShapeStyle> = new Map(
  SHAPE_HANDLERS.flatMap((handler) =>
    handler.styleDefaults === undefined ? [] : [[handler.type, handler.styleDefaults] as const],
  ),
);

/**
 * Return the Style Keys a Shape Type's Handler Has Its Own Default For.
 *
 * @param shapeType - Shape Type (`"emoji"`, `"spritesheet"` …)
 * @returns Style Keys in `DEFAULT_STYLE` Order (none for paper, star, triangle, polygon, heart and path)
 */
export function handlerStyleKeys(shapeType: string): readonly StyleKey[] {
  const defaults = HANDLER_STYLES.get(shapeType);

  return defaults === undefined ? [] : STYLE_KEYS.filter((key) => defaults[key] !== undefined);
}

/**
 * Compute What a Shape Inherits for a Style Key: the library default, then its handler's default, then `paper`.
 *
 * @param key - Style Key
 * @param shapeType - Shape Type
 * @param paper - Base `paper` Options as the Builder Sends Them
 * @returns Full Value
 */
export function inheritedStyle(
  key: StyleKey,
  shapeType: string,
  paper: Readonly<Record<string, unknown>>,
): StyleFull {
  // the base paper comes from the editor's own builder, so every layer can be represented
  return (
    effectiveStyle(key, [DEFAULT_STYLE[key], HANDLER_STYLES.get(shapeType)?.[key], paper[key]]) ??
    libraryStyle(key)
  );
}

/**
 * Return the Four Corners of a Corner Radius Full Value.
 *
 * @param full - A Pair (every corner) or a Per-Corner Object
 * @returns Corner Pairs in `tl, tr, br, bl` Order
 */
function cornersOf(full: StyleFull): readonly StyleFull[] {
  return isStyleObject(full)
    ? CORNERS.map(([corner]) => full[corner] ?? false)
    : [full, full, full, full];
}

/**
 * Create a Geometry Group Holding a Range (read from a span control).
 *
 * @param key - Geometry Key (also the control key)
 * @param fallback - Library Default, or Null when There Is None
 * @returns Geometry Group
 */
function geometryPair(key: GeometryKey, fallback: NumberPair | null): GeometryGroup {
  return {
    key,
    controls: [key],
    read: (state, prefix) => pair(state, prefix + key),
    fallback,
    same: sameDeep,
    emit: (full) => explicitStyle(full),
  };
}

/**
 * Paper Geometry Groups in `PaperGeometry` Option Order.
 * The base `paper` sends `aspectRatio` only while Use Aspect Ratio is on (the library has no default for it).
 */
export const GEOMETRY_GROUPS: readonly GeometryGroup[] = [
  {
    key: "form",
    controls: ["form"],
    read: (state, prefix) => {
      const forms = list(state, `${prefix}form`);

      // no chip selected means the library default form
      return forms.length > 0 ? forms : [DEFAULT_PAPER_GEOMETRY.form];
    },
    fallback: [DEFAULT_PAPER_GEOMETRY.form],
    same: sameDeep,
    emit: (full) => {
      const [only, ...others] = asList(full) ?? [];

      // one form is sent as a string, several as a list in selection order
      return typeof only === "string" && others.length === 0 ? only : explicitStyle(full);
    },
  },
  geometryPair("width", toPair(DEFAULT_PAPER_GEOMETRY.width)),
  geometryPair("height", toPair(DEFAULT_PAPER_GEOMETRY.height)),
  geometryPair("aspectRatio", null),
  {
    key: "cornerRadius",
    controls: ["cornerRadius", "cornerPerCorner", "cornerTL", "cornerTR", "cornerBR", "cornerBL"],
    read: (state, prefix) =>
      bool(state, `${prefix}cornerPerCorner`)
        ? Object.fromEntries(
            CORNERS.map(([corner, control]) => [corner, pair(state, prefix + control)]),
          )
        : pair(state, `${prefix}cornerRadius`),
    fallback: toPair(DEFAULT_PAPER_GEOMETRY.cornerRadius),
    // a single radius and four equal corners resolve the same
    same: (a, b) => sameDeep(cornersOf(a), cornersOf(b)),
    emit: (full, explicit) => {
      if (!isStyleObject(full)) {
        return explicitStyle(full);
      }

      // an omitted corner is 0, so the minimal form leaves out the corners at 0
      const omitted = toPair(OMITTED_CORNER_RADIUS);

      return emitObject(full, (_corner, part) => explicit || !sameDeep(part, omitted));
    },
  },
  geometryPair("skew", toPair(DEFAULT_PAPER_GEOMETRY.skew)),
];
