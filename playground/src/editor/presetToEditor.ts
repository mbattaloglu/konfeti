import type { FireInput } from "konfeti";

import { buildMinimalPaper } from "../buildOptions";
import type { ControlState, ControlValue } from "../controlTypes";
import { DEMO_SVG } from "../demoAssets";
import type { DemoAssets } from "../demoAssets";
import {
  acceptValue,
  CONTROL_INDEX,
  entryOf,
  initialBurst,
  MAX_BURSTS,
  normalizeBurst,
} from "./burstState";
import type { BurstState } from "./burstState";
import {
  DEFAULT_ATTRACT,
  DEFAULT_FLOOR,
  DEFAULT_ORIGIN,
  DEFAULT_PHYSICS,
  DEFAULT_SWIRL,
} from "./libraryDefaults";
import { asList, isRecord, pairOf, sameDeep } from "./optionValues";
import {
  canonicalStyles,
  overrideKey,
  PAPER_PREFIX,
  shapeTypeOf,
  stylesKey,
} from "./overrideGroups";
import {
  entryStyleOf,
  handlerStyleKeys,
  inheritedStyle,
  paperStyleOf,
  readGeometry,
  STYLE_KEYS,
  writeGeometry,
  writeStyle,
} from "./styleModel";
import type { GeometryKey, StyleKey } from "./styleModel";

/**
 * Why a Path Could Not Be Loaded as Given.
 * - `unknown`: a key the editor has no control for;
 * - `value`: a value the editor (or the library) rejects;
 * - `form`: a form the editor cannot show (an element, a custom shape, a weighted list …);
 * - `order`: shape entries out of card order (still loaded; random picks per seed differ);
 * - `ignored`: a value the library ignores there (still loaded);
 * - `hook`: a callback (the editor's own hooks are global switches).
 */
export type LoadIssueReason = "unknown" | "value" | "form" | "order" | "ignored" | "hook";

/**
 * One Path the Loader Could Not Represent Exactly.
 */
export type LoadIssue = {
  /**
   * Option Path (`shapes[1].trail`, `[2].delay` in a list).
   */
  readonly path: string;
  /**
   * Reason.
   */
  readonly reason: LoadIssueReason;
};

/**
 * Fire Input Turned into Editor State.
 */
export type LoadedInput = {
  /**
   * Burst States in Canonical Form, One per Burst (at most MAX_BURSTS).
   */
  readonly bursts: readonly BurstState[];
  /**
   * Everything that Could Not Be Loaded Exactly (empty for every built-in preset).
   */
  readonly issues: readonly LoadIssue[];
};

/**
 * Hook Keys of the Fire Options.
 */
const HOOK_KEYS: readonly string[] = [
  "onStart",
  "onParticleSpawn",
  "onParticleUpdate",
  "onParticleDeath",
  "onComplete",
];

/**
 * Top-Level Fire Option Keys.
 */
const TOP_KEYS = new Set<string>([
  "particleCount",
  "origin",
  "angle",
  "spread",
  "startVelocity",
  "lifetime",
  "emission",
  "delay",
  "seed",
  "paper",
  "shapes",
  "physics",
  "formation",
  ...HOOK_KEYS,
]);

/**
 * Formation Option Keys.
 */
const FORMATION_KEYS = new Set<string>([
  "text",
  "font",
  "image",
  "width",
  "imageColors",
  "mode",
  "assemble",
  "hold",
  "easing",
  "spacing",
  "fit",
]);

/**
 * Built-in Physics Option Keys (anything else is a custom module).
 */
const PHYSICS_KEYS = new Set<string>(Object.keys(DEFAULT_PHYSICS));

/**
 * Paper Geometry Keys.
 */
const GEOMETRY_KEYS: readonly string[] = [
  "form",
  "width",
  "height",
  "aspectRatio",
  "cornerRadius",
  "skew",
];

/**
 * The Two Characters a Formation Text Field Uses for a New Line.
 */
const TYPED_NEWLINE = "\\n";

/**
 * Separator of a Text or Emoji List in Its Text Field.
 */
const LIST_SEPARATOR = ", ";

/**
 * Card Prefixes in Card Order (the order the builder writes shape entries in).
 */
const CARD_ORDER: readonly string[] = CONTROL_INDEX.cards.map((card) => card.prefix);

/**
 * Card Prefix of Each Shape Type.
 */
const CARD_BY_TYPE: ReadonlyMap<unknown, string> = new Map(
  CARD_ORDER.map((prefix) => [shapeTypeOf(prefix), prefix]),
);

/**
 * Shape-Specific Keys of Each Card (handled by its content loader, not as style).
 */
const CONTENT_KEYS: Readonly<Record<string, readonly string[]>> = {
  paper: ["type", "weight"],
  star: ["type", "weight", "size", "points", "innerRatio"],
  triangle: ["type", "weight", "size"],
  polygon: ["type", "weight", "size", "sides"],
  heart: ["type", "weight", "size"],
  ribbon: ["type", "weight", "length", "thickness", "waves"],
  path: ["type", "weight", "size", "path", "viewBox"],
  emoji: ["type", "weight", "size", "emoji", "fontFamily"],
  text: ["type", "weight", "size", "text", "fontFamily", "fontWeight"],
  image: ["type", "weight", "size", "src", "tint"],
  sprite: ["type", "weight", "size", "src", "frames", "fps", "loop", "randomStartFrame", "tint"],
};

/**
 * Check Whether a Key Is a Style Key.
 *
 * @param key - Option Key
 * @returns Style Key Flag
 */
function isStyleKey(key: string): key is StyleKey {
  return STYLE_KEYS.some((style) => style === key);
}

/**
 * Check Whether a Key Is a Paper Geometry Key.
 *
 * @param key - Option Key
 * @returns Geometry Key Flag
 */
function isGeometryKey(key: string): key is GeometryKey {
  return GEOMETRY_KEYS.includes(key);
}

/**
 * Check Whether a Value Is Given (neither undefined nor null).
 *
 * @param value - Any Value
 * @returns Given Flag
 */
function isGiven(value: unknown): boolean {
  return value !== undefined && value !== null;
}

/**
 * Check Whether a Value Is a Page Element or a Client Point (origins the editor cannot show).
 *
 * @param value - Any Value
 * @returns Element or Client Point Flag
 */
function isElementOrClientPoint(value: unknown): boolean {
  return (
    (typeof Element !== "undefined" && value instanceof Element) ||
    (isRecord(value) && ("clientX" in value || "clientY" in value))
  );
}

/**
 * Turn One Fire Options Object into a Burst State.
 *
 * @param options - Fire Options (untrusted shape)
 * @param assets - Demo Assets
 * @param at - Path Prefix of This Burst (`"[1]."` in a list)
 * @param issues - Issue List to Append To
 * @returns Canonical Burst State
 */
function loadBurst(
  options: unknown,
  assets: DemoAssets,
  at: string,
  issues: LoadIssue[],
): BurstState {
  const state: ControlState = { ...initialBurst() };
  const issue = (path: string, reason: LoadIssueReason): void => {
    issues.push({ path: `${at}${path}`, reason });
  };

  // every value passes the same checks as a share link: all of a group's values, or none of them
  const putAll = (
    values: Readonly<Record<string, unknown>>,
    path: string,
    prefix = "",
  ): boolean => {
    const accepted: (readonly [string, ControlValue])[] = [];

    for (const [baseKey, value] of Object.entries(values)) {
      const key = prefix === "" ? baseKey : overrideKey(prefix, baseKey);
      const entry = entryOf(key);
      const checked = entry === undefined ? null : acceptValue(entry, value);

      if (checked === null) {
        issue(path, "value");
        return false;
      }

      accepted.push([key, checked]);
    }

    for (const [key, value] of accepted) {
      state[key] = value;
    }

    return true;
  };
  const put = (key: string, value: unknown, path: string): boolean =>
    putAll({ [key]: value }, path);
  const putSpan = (key: string, value: unknown, path: string): boolean => {
    const range = pairOf(value);

    if (range === null) {
      issue(path, "value");
      return false;
    }

    return put(key, range, path);
  };
  // a blank string means "not set" to the editor, so it cannot be rebuilt as given
  const putText = (key: string, value: unknown, path: string): boolean => {
    if (typeof value !== "string" || value.trim() === "") {
      issue(path, "value");
      return false;
    }

    return put(key, value, path);
  };
  const putList = (key: string, value: unknown, path: string): void => {
    const items = typeof value === "string" ? [value] : asList(value);

    if (items === null) {
      issue(path, isGiven(value) ? "form" : "value");
    } else if (items.length === 0) {
      issue(path, "value");
    } else if (
      items.every(
        (item): item is string =>
          typeof item === "string" &&
          item !== "" &&
          item.trim() === item &&
          !item.includes(LIST_SEPARATOR.trim()),
      )
    ) {
      put(key, items.join(LIST_SEPARATOR), path);
    } else {
      issue(path, "form");
    }
  };

  if (!isRecord(options)) {
    issue("", "form");
    return normalizeBurst(state);
  }

  for (const key of Object.keys(options)) {
    if (!TOP_KEYS.has(key)) {
      issue(key, "unknown");
    } else if (HOOK_KEYS.includes(key) && isGiven(options[key])) {
      issue(key, "hook");
    }
  }

  const formation = options["formation"];
  const isFormation = isGiven(formation);

  if (isGiven(options["particleCount"])) {
    // under a formation an explicit count is the cap
    if (put("particleCount", options["particleCount"], "particleCount") && isFormation) {
      state["useFormationCap"] = true;
    }
  }

  if (isGiven(options["angle"])) {
    putSpan("angle", options["angle"], "angle");
  }

  if (isGiven(options["spread"])) {
    put("spread", options["spread"], "spread");
  }

  if (isGiven(options["startVelocity"])) {
    putSpan(
      isFormation ? "formationVelocity" : "velocity",
      options["startVelocity"],
      "startVelocity",
    );
  }

  if (isGiven(options["lifetime"])) {
    putSpan("lifetime", options["lifetime"], "lifetime");
  }

  const origin = options["origin"];

  if (isGiven(origin)) {
    if (isElementOrClientPoint(origin) || !isRecord(origin)) {
      issue("origin", "form");
    } else {
      for (const key of Object.keys(origin)) {
        if (key === "x" || key === "y") {
          if (isGiven(origin[key])) {
            putSpan(key === "x" ? "originX" : "originY", origin[key], `origin.${key}`);
          }
        } else {
          issue(`origin.${key}`, "unknown");
        }
      }
    }
  }

  const emission = options["emission"];

  if (isGiven(emission)) {
    if (!isRecord(emission)) {
      issue("emission", "value");
    } else if (isFormation) {
      // the library forms a shape from a single burst only
      if (emission["mode"] !== "burst") {
        issue("emission", "value");
      }
    } else if (emission["mode"] === "stream") {
      put("emissionMode", "stream", "emission.mode");
      put("streamDuration", emission["duration"], "emission.duration");
    } else if (emission["mode"] === "interval") {
      put("emissionMode", "interval", "emission.mode");
      put("intervalEvery", emission["every"], "emission.every");
      put("intervalTimes", emission["times"], "emission.times");
    } else if (emission["mode"] !== "burst") {
      issue("emission.mode", "value");
    }
  }

  if (isGiven(options["delay"])) {
    put("delay", options["delay"], "delay");
  }

  if (isGiven(options["seed"]) && put("seed", options["seed"], "seed")) {
    state["useSeed"] = true;
  }

  if (isRecord(formation)) {
    loadFormation(formation);
  } else if (isFormation) {
    issue("formation", "value");
  }

  const paper = isRecord(options["paper"]) ? options["paper"] : {};

  if (isGiven(options["paper"]) && !isRecord(options["paper"])) {
    issue("paper", "form");
  }

  for (const [key, value] of Object.entries(paper)) {
    const path = `paper.${key}`;

    if (value === undefined) {
      continue;
    }

    if (isGeometryKey(key)) {
      const full = value === null ? null : readGeometry(key, value);

      if (full === null) {
        issue(path, "value");
      } else if (putAll(writeGeometry(key, full), path) && key === "aspectRatio") {
        state["useAspect"] = true;
      }
    } else if (isStyleKey(key)) {
      const full = value === null ? null : paperStyleOf(key, value);

      if (full === null) {
        issue(path, "value");
      } else {
        putAll(writeStyle(key, full), path);
      }
    } else {
      issue(path, "unknown");
    }
  }

  const shapes = options["shapes"];

  if (isGiven(shapes)) {
    const entries = asList(shapes);

    if (entries === null) {
      issue("shapes", "form");
    } else if (entries.length === 0) {
      // the library throws on an empty list
      issue("shapes", "value");
    } else {
      loadShapes(entries, paper);
    }
  }

  const physics = options["physics"];

  if (isRecord(physics)) {
    loadPhysics(physics);
  } else if (isGiven(physics)) {
    issue("physics", "form");
  }

  return normalizeBurst(state);

  /**
   * Load the Formation Options.
   *
   * @param f - Formation Options
   */
  function loadFormation(f: Readonly<Record<string, unknown>>): void {
    state["formation"] = true;

    for (const key of Object.keys(f)) {
      if (!FORMATION_KEYS.has(key)) {
        issue(`formation.${key}`, "unknown");
      }
    }

    // the resolver tests `!== undefined`, so a null text or image counts as set
    const hasText = f["text"] !== undefined;
    const hasImage = f["image"] !== undefined;

    if (hasText === hasImage) {
      issue("formation", "value");
    } else if (hasText) {
      const text = f["text"];
      state["formationSource"] = "text";

      if (typeof text !== "string" || text.trim() === "" || text.includes(TYPED_NEWLINE)) {
        issue("formation.text", "value");
      } else {
        put("formationText", text.replace(/\n/g, TYPED_NEWLINE), "formation.text");
      }

      if (f["font"] !== undefined) {
        putText("formationFont", f["font"], "formation.font");
      }

      for (const key of ["width", "imageColors"]) {
        if (f[key] !== undefined) {
          issue(`formation.${key}`, "unknown");
        }
      }
    } else {
      state["formationSource"] = "image";
      loadFormationImage(f["image"]);

      if (f["width"] !== undefined && put("formationWidth", f["width"], "formation.width")) {
        state["useFormationWidth"] = true;
      }

      if (f["imageColors"] !== undefined) {
        put("formationImageColors", f["imageColors"], "formation.imageColors");
      }

      if (f["font"] !== undefined) {
        issue("formation.font", "unknown");
      }
    }

    if (f["mode"] !== undefined) {
      put("formationMode", f["mode"], "formation.mode");
    }

    if (f["assemble"] !== undefined) {
      put("formationAssemble", f["assemble"], "formation.assemble");

      // stored, but appear mode forces the fly-in to 0
      if (state["formationMode"] === "appear") {
        issue("formation.assemble", "ignored");
      }
    }

    const fields: readonly (readonly [string, string])[] = [
      ["easing", "formationEasing"],
      ["hold", "formationHold"],
      ["spacing", "formationSpacing"],
      ["fit", "formationFit"],
    ];

    for (const [key, control] of fields) {
      if (f[key] !== undefined) {
        put(control, f[key], `formation.${key}`);
      }
    }
  }

  /**
   * Load the Formation Image Source.
   *
   * @param image - Formation Image
   */
  function loadFormationImage(image: unknown): void {
    if (image === assets.logoCanvas) {
      put("formationImage", "demo logo", "formation.image");
    } else if (typeof image === "string") {
      if (putText("formationImageUrl", image, "formation.image")) {
        put("formationImage", "url", "formation.image");
      }
    } else {
      issue("formation.image", "form");
    }
  }

  /**
   * Load the Shape Entries onto Their Cards.
   *
   * @param entries - Shape Entries
   * @param paperIn - Base `paper` of the Input
   */
  function loadShapes(
    entries: readonly unknown[],
    paperIn: Readonly<Record<string, unknown>>,
  ): void {
    // compensation compares with the base paper the editor will send
    const minimalPaper = buildMinimalPaper(state);
    const seen = new Set<string>();
    let lastOrder = -1;

    entries.forEach((entry, index) => {
      const path = `shapes[${String(index)}]`;

      if (!isRecord(entry)) {
        issue(path, "form");
        return;
      }

      const prefix = CARD_BY_TYPE.get(entry["type"]);

      if (prefix === undefined) {
        issue(`${path}.type`, "form");
        return;
      }

      // one card per shape type
      if (seen.has(prefix)) {
        issue(path, "form");
        return;
      }

      seen.add(prefix);
      const order = CARD_ORDER.indexOf(prefix);

      // still loaded; the rebuilt list follows the card order, so random picks per seed differ
      if (order < lastOrder) {
        issue(path, "order");
      }

      lastOrder = Math.max(lastOrder, order);
      state[`${prefix}.enabled`] = true;
      loadContent(prefix, entry, path);

      const type = shapeTypeOf(prefix);
      const listed: string[] = [];

      for (const [key, value] of Object.entries(entry)) {
        const keyPath = `${path}.${key}`;

        if (value === undefined || CONTENT_KEYS[prefix]?.includes(key) === true) {
          continue;
        }

        if (isStyleKey(key)) {
          const full = value === null ? null : entryStyleOf(key, type, paperIn, value);

          if (full === null) {
            issue(keyPath, "value");
          } else if (putAll(writeStyle(key, full), keyPath, prefix)) {
            listed.push(key);
          }
        } else if (prefix === PAPER_PREFIX && isGeometryKey(key)) {
          const full = value === null ? null : readGeometry(key, value);

          if (full === null) {
            issue(keyPath, "value");
          } else if (putAll(writeGeometry(key, full), keyPath, prefix)) {
            listed.push(key);
          }
        } else {
          issue(keyPath, "unknown");
        }
      }

      // a paper key set to its library default hides a shape default after the minimal rebuild: keep what the
      // shape got as its own style
      for (const key of handlerStyleKeys(type)) {
        if (listed.includes(key)) {
          continue;
        }

        const original = inheritedStyle(key, type, paperIn);

        if (
          !sameDeep(original, inheritedStyle(key, type, minimalPaper)) &&
          putAll(writeStyle(key, original), `${path}.${key}`, prefix)
        ) {
          listed.push(key);
        }
      }

      state[stylesKey(prefix)] = canonicalStyles(prefix, listed);
    });
  }

  /**
   * Load the Shape-Specific Keys of One Entry.
   *
   * @param prefix - Card Prefix
   * @param entry - Shape Entry
   * @param path - Path of the Entry
   */
  function loadContent(
    prefix: string,
    entry: Readonly<Record<string, unknown>>,
    path: string,
  ): void {
    const at = (key: string): string => `${path}.${key}`;
    const given = (key: string): boolean => isGiven(entry[key]);

    if (given("weight")) {
      put(`${prefix}.weight`, entry["weight"], at("weight"));
    }

    for (const key of ["size", "points", "sides", "length", "fps"]) {
      if (given(key) && CONTENT_KEYS[prefix]?.includes(key) === true) {
        putSpan(`${prefix}.${key}`, entry[key], at(key));
      }
    }

    for (const key of ["innerRatio", "thickness", "waves"]) {
      if (given(key) && CONTENT_KEYS[prefix]?.includes(key) === true) {
        put(`${prefix}.${key}`, entry[key], at(key));
      }
    }

    if (entry["tint"] !== undefined && CONTENT_KEYS[prefix]?.includes("tint") === true) {
      const tint = entry["tint"];
      // true is the library's multiply
      const option =
        tint === false
          ? "off"
          : tint === true || tint === "multiply"
            ? "multiply"
            : tint === "fill"
              ? "fill"
              : null;

      if (option === null) {
        issue(at("tint"), "value");
      } else {
        put(`${prefix}.tint`, option, at("tint"));
      }
    }

    switch (prefix) {
      case "path": {
        putText("path.d", entry["path"], at("path"));
        const box = asList(entry["viewBox"]);

        if (given("viewBox")) {
          if (box?.length === 2) {
            putAll({ "path.viewBox": box[0], "path.viewBoxHeight": box[1] }, at("viewBox"));
          } else {
            issue(at("viewBox"), "value");
          }
        }

        break;
      }
      case "emoji":
      case "text":
        putList(`${prefix}.list`, entry[prefix], at(prefix));

        if (entry["fontFamily"] !== undefined) {
          putText(`${prefix}.fontFamily`, entry["fontFamily"], at("fontFamily"));
        }

        if (prefix === "text" && given("fontWeight")) {
          put("text.fontWeight", String(entry["fontWeight"]), at("fontWeight"));
        }

        break;
      case "image":
        loadImageSource(entry["src"], at("src"));
        break;
      case "sprite":
        loadSpriteSource(entry["src"], at("src"));
        loadFrames(entry["frames"], at("frames"));

        if (given("loop")) {
          put("sprite.loop", entry["loop"], at("loop"));
        }

        if (given("randomStartFrame")) {
          put("sprite.randomStart", entry["randomStartFrame"], at("randomStartFrame"));
        }

        break;
      default:
        break;
    }
  }

  /**
   * Load the Image Card's Source.
   *
   * @param source - Image Source
   * @param path - Path of the Source
   */
  function loadImageSource(source: unknown, path: string): void {
    if (source === assets.coinCanvas) {
      put("image.src", "demo canvas", path);
    } else if (source === assets.coinUrl) {
      put("image.src", "demo url", path);
    } else if (source === DEMO_SVG) {
      put("image.src", "inline svg", path);
    } else if (typeof source === "string") {
      if (putText("image.url", source, path)) {
        put("image.src", "url", path);
      }
    } else {
      issue(path, isGiven(source) ? "form" : "value");
    }
  }

  /**
   * Load the Sprite Card's Sheet.
   *
   * @param source - Sheet Source
   * @param path - Path of the Source
   */
  function loadSpriteSource(source: unknown, path: string): void {
    if (source === assets.sheetCanvas) {
      put("sprite.src", "demo canvas", path);
    } else if (source === assets.sheetUrl) {
      put("sprite.src", "demo url", path);
    } else if (typeof source === "string") {
      if (putText("sprite.url", source, path)) {
        put("sprite.src", "url", path);
      }
    } else {
      issue(path, isGiven(source) ? "form" : "value");
    }
  }

  /**
   * Load the Sprite Sheet Grid.
   *
   * @param frames - Frames Option
   * @param path - Path of the Frames
   */
  function loadFrames(frames: unknown, path: string): void {
    if (!isGiven(frames)) {
      issue(path, "value");
    } else if (!isRecord(frames)) {
      // a list of frame rectangles has no grid controls
      issue(path, "form");
    } else {
      putAll(
        {
          "sprite.cols": frames["cols"],
          "sprite.rows": frames["rows"],
          "sprite.count": frames["count"] ?? 0,
        },
        path,
      );
    }
  }

  /**
   * Merge a Physics Toggle the Way the Library Does (`false` off, `true` the defaults, an object over them).
   *
   * @param value - Option Value
   * @param defaults - Default Settings
   * @param path - Path of the Toggle
   * @returns Merged Settings, False When Off, or Null When the Value Is Rejected
   */
  function mergeToggle(
    value: unknown,
    defaults: Readonly<Record<string, unknown>>,
    path: string,
  ): Readonly<Record<string, unknown>> | false | null {
    if (value === false) {
      return false;
    }

    if (value === true) {
      return defaults;
    }

    if (!isRecord(value)) {
      issue(path, "value");
      return null;
    }

    const merged: Record<string, unknown> = { ...defaults };

    for (const [key, sub] of Object.entries(value)) {
      if (sub === null) {
        issue(`${path}.${key}`, "value");
        return null;
      }

      if (sub !== undefined) {
        merged[key] = sub;
      }
    }

    return merged;
  }

  /**
   * Load the Physics Options.
   *
   * @param physicsIn - Physics Options
   */
  function loadPhysics(physicsIn: Readonly<Record<string, unknown>>): void {
    for (const key of Object.keys(physicsIn)) {
      // anything else is a custom module the editor has no controls for
      if (!PHYSICS_KEYS.has(key)) {
        issue(`physics.${key}`, "form");
      }
    }

    for (const key of ["gravity", "drag", "wind"]) {
      if (isGiven(physicsIn[key])) {
        putSpan(key, physicsIn[key], `physics.${key}`);
      }
    }

    const terminal = physicsIn["terminalVelocity"];

    if (isGiven(terminal) && terminal !== DEFAULT_PHYSICS.terminalVelocity) {
      if (put("terminalVelocity", terminal, "physics.terminalVelocity")) {
        state["useTerminal"] = true;
      }
    }

    loadSwirl(physicsIn["swirl"]);
    loadFloor(physicsIn["floor"]);
    loadAttract(physicsIn["attract"]);
  }

  /**
   * Load the Swirl Toggle.
   *
   * @param value - Swirl Option
   */
  function loadSwirl(value: unknown): void {
    const swirl = isGiven(value) ? mergeToggle(value, DEFAULT_SWIRL, "physics.swirl") : null;

    if (swirl === false) {
      state["swirl"] = false;
    } else if (swirl !== null) {
      state["swirl"] = true;
      putSpan("swirlStrength", swirl["strength"], "physics.swirl.strength");
      putSpan("swirlFrequency", swirl["frequency"], "physics.swirl.frequency");
    }
  }

  /**
   * Load the Floor Toggle.
   *
   * @param value - Floor Option
   */
  function loadFloor(value: unknown): void {
    const floor = isGiven(value) ? mergeToggle(value, DEFAULT_FLOOR, "physics.floor") : null;

    if (floor === false) {
      state["floor"] = false;
    } else if (floor !== null) {
      state["floor"] = true;
      putAll(
        { floorY: floor["y"], floorBounce: floor["bounce"], floorFriction: floor["friction"] },
        "physics.floor",
      );
    }
  }

  /**
   * Load the Attractor Toggle.
   *
   * @param value - Attract Option
   */
  function loadAttract(value: unknown): void {
    const attract = isGiven(value) ? mergeToggle(value, DEFAULT_ATTRACT, "physics.attract") : null;

    if (attract === false) {
      state["attract"] = false;
      return;
    }

    if (attract === null) {
      return;
    }

    state["attract"] = true;
    const target = attract["target"];

    if (target === "pointer") {
      put("attractTarget", "pointer", "physics.attract.target");
    } else if (isRecord(target) && !isElementOrClientPoint(target)) {
      for (const key of Object.keys(target)) {
        if (key !== "x" && key !== "y") {
          issue(`physics.attract.target.${key}`, "unknown");
        }
      }

      // a point that leaves out an axis aims at the default origin's axis, as the library does
      if (
        putSpan("attractX", target["x"] ?? DEFAULT_ORIGIN.x, "physics.attract.target.x") &&
        putSpan("attractY", target["y"] ?? DEFAULT_ORIGIN.y, "physics.attract.target.y")
      ) {
        put("attractTarget", "point", "physics.attract.target");
      }
    } else {
      issue("physics.attract.target", "form");
    }

    putSpan("attractStrength", attract["strength"], "physics.attract.strength");
    const radius = attract["radius"];

    // 0 on the radius slider means "no limit"
    if (radius === DEFAULT_ATTRACT.radius) {
      state["attractRadius"] = 0;
    } else if (typeof radius === "number" && radius > 0) {
      put("attractRadius", radius, "physics.attract.radius");
    } else {
      issue("physics.attract.radius", "value");
    }

    put("attractFalloff", attract["falloff"], "physics.attract.falloff");
  }
}

/**
 * Turn Fire Input (a preset, pasted JSON) into Editor Bursts.
 * The inverse of the builder: every burst is loaded into the canonical burst form, and every form the editor cannot
 * represent is reported, never dropped silently. A list keeps at most MAX_BURSTS bursts.
 *
 * @param input - Fire Input
 * @param assets - Demo Assets (the demo canvases map back to their source options)
 * @returns Bursts and Issues
 */
export function presetToEditor(input: FireInput, assets: DemoAssets): LoadedInput {
  const issues: LoadIssue[] = [];
  // json is a user boundary: a list is told apart at runtime
  const list: readonly unknown[] = Array.isArray(input) ? input : [input];

  if (list.length === 0) {
    return { bursts: [initialBurst()], issues: [{ path: "", reason: "value" }] };
  }

  if (list.length > MAX_BURSTS) {
    issues.push({ path: `[${String(MAX_BURSTS)}]`, reason: "form" });
  }

  const bursts = list
    .slice(0, MAX_BURSTS)
    .map((options, index) =>
      loadBurst(options, assets, Array.isArray(input) ? `[${String(index)}].` : "", issues),
    );

  return { bursts, issues };
}
