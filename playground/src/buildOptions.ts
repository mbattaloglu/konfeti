import type {
  AttractOptions,
  ColorInput,
  EasingName,
  FireOptions,
  FlipAxis,
  FormationOptions,
  OriginPoint,
  PaperForm,
  PaperStyle,
  PhysicsOptions,
} from "konfeti";

import type { ControlState } from "./controlTypes";
import type { DemoAssets } from "./demoAssets";
import { asColor, bool, list, num, splitList, str } from "./stateReaders";

/**
 * Any Shape Entry of `FireOptions.shapes`.
 */
type ShapeEntry = NonNullable<FireOptions["shapes"]>[number];

/**
 * Emission Settings of `FireOptions.emission`.
 */
type Emission = NonNullable<FireOptions["emission"]>;

/**
 * Extra Switches for Building Options.
 */
export type BuildSettings = {
  /**
   * Include `origin` from the sliders (off for click / element origins).
   */
  readonly includeOrigin?: boolean;
  /**
   * Include the formation when it is switched on (off for streams, which cannot form a shape).
   */
  readonly includeFormation?: boolean;
};

/**
 * Collapse a List to a Single Value When It Has One Entry.
 *
 * @param values - Entries
 * @returns Single Entry or the List
 */
function oneOrList<T>(values: readonly T[]): T | readonly T[] {
  const [first] = values;

  return values.length === 1 && first !== undefined ? first : values;
}

/**
 * Build Symmetric `[-value, value]` Range.
 *
 * @param value - Half Width
 * @returns Range Tuple
 */
function symmetric(value: number): readonly [number, number] {
  return [-value, value];
}

/**
 * Cast Dropdown Value to an Easing Name.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Easing Name
 */
function easing(state: ControlState, key: string): EasingName {
  return str(state, key) as EasingName;
}

/**
 * Build Emission Options.
 *
 * @param state - Control State
 * @returns Emission Options, or `undefined` for the default burst
 */
function buildEmission(state: ControlState): Emission | undefined {
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
      return undefined;
  }
}

/**
 * Build Paper Style (inherited by every shape).
 *
 * @param state - Control State
 * @returns Paper Style
 */
function buildPaper(state: ControlState): PaperStyle {
  const forms = list(state, "form") as readonly PaperForm[];
  const colors = list(state, "colors").map(asColor);
  const backColor = list(state, "backColor").map(asColor);
  const skew = num(state, "skew");
  const tilt = num(state, "tilt");

  return {
    ...(forms.length > 0 ? { form: oneOrList(forms) } : {}),
    width: [num(state, "widthMin"), num(state, "widthMax")],
    ...(bool(state, "useAspect")
      ? { aspectRatio: num(state, "aspectRatio") }
      : { height: [num(state, "heightMin"), num(state, "heightMax")] }),
    cornerRadius: num(state, "cornerRadius"),
    ...(skew > 0 ? { skew: symmetric(skew) } : {}),
    scale: num(state, "scale"),
    ...(colors.length > 0 ? { colors } : {}),
    colorMode: str(state, "colorMode") === "sequence" ? "sequence" : "random",
    backColor: backColor.length === 0 ? "auto" : backColor,
    backShade: num(state, "backShade"),
    gradient: bool(state, "gradient")
      ? {
          colors: [asColor(str(state, "gradientA")), asColor(str(state, "gradientB"))],
          angle: num(state, "gradientAngle"),
        }
      : false,
    colorOverLife: bool(state, "colorOverLife")
      ? { to: asColor(str(state, "colorOverLifeTo")), easing: easing(state, "colorOverLifeEasing") }
      : false,
    stroke: bool(state, "stroke")
      ? { color: asColor(str(state, "strokeColor")), width: num(state, "strokeWidth") }
      : false,
    opacity: num(state, "opacity"),
    fadeIn: num(state, "fadeIn"),
    fadeOut: bool(state, "fadeOut")
      ? { start: num(state, "fadeStart"), easing: easing(state, "fadeEasing") }
      : false,
    scaleOverLife: bool(state, "scaleOverLife")
      ? { to: num(state, "scaleTo"), easing: easing(state, "scaleEasing") }
      : false,
    rotation: [0, num(state, "rotationMax")],
    rotationSpeed: symmetric(num(state, "rotationSpeed")),
    flip: bool(state, "flip")
      ? { axis: str(state, "flipAxis") as FlipAxis, frequency: num(state, "flipFrequency") }
      : false,
    wobble: bool(state, "wobble")
      ? { amplitude: num(state, "wobbleAmplitude"), frequency: num(state, "wobbleFrequency") }
      : false,
    ...(tilt > 0 ? { tilt: symmetric(tilt) } : {}),
    shadow: bool(state, "shadow")
      ? {
          color: asColor(str(state, "shadowColor")),
          blur: num(state, "shadowBlur"),
          offsetX: num(state, "shadowX"),
          offsetY: num(state, "shadowY"),
        }
      : false,
    shine: num(state, "shine"),
    blendMode: str(state, "blendMode") as GlobalCompositeOperation,
    trail: bool(state, "trail")
      ? {
          length: num(state, "trailLength"),
          width: num(state, "trailWidth"),
          opacity: num(state, "trailOpacity"),
          color: bool(state, "trailCustomColor") ? asColor(str(state, "trailColor")) : "particle",
        }
      : false,
  };
}

/**
 * Build Optional Colors Override for a Shape Entry.
 *
 * @param state - Control State
 * @param key - Colors Text Key
 * @returns Partial Entry with `colors`, or an empty object
 */
function colorsOverride(
  state: ControlState,
  key: string,
): { readonly colors?: readonly ColorInput[] } {
  const colors = list(state, key).map(asColor);

  return colors.length > 0 ? { colors } : {};
}

/**
 * Build Weighted Shape Mix from the Enabled Shape Cards.
 *
 * @param state - Control State
 * @param assets - Demo Images
 * @returns Shape Entries (empty = paper only)
 */
function buildShapes(state: ControlState, assets: DemoAssets): ShapeEntry[] {
  const shapes: ShapeEntry[] = [];
  const on = (prefix: string): boolean => bool(state, `${prefix}.enabled`);
  const w = (prefix: string): number => num(state, `${prefix}.weight`);
  const s = (prefix: string): number => num(state, `${prefix}.size`);

  if (on("paper")) {
    shapes.push({ type: "paper", weight: w("paper") });
  }

  if (on("star")) {
    shapes.push({
      type: "star",
      weight: w("star"),
      size: s("star"),
      points: num(state, "star.points"),
      innerRatio: num(state, "star.innerRatio"),
      ...colorsOverride(state, "star.colors"),
    });
  }

  if (on("triangle")) {
    shapes.push({ type: "triangle", weight: w("triangle"), size: s("triangle") });
  }

  if (on("polygon")) {
    shapes.push({
      type: "polygon",
      weight: w("polygon"),
      size: s("polygon"),
      sides: num(state, "polygon.sides"),
    });
  }

  if (on("heart")) {
    shapes.push({
      type: "heart",
      weight: w("heart"),
      size: s("heart"),
      ...colorsOverride(state, "heart.colors"),
    });
  }

  if (on("ribbon")) {
    shapes.push({
      type: "ribbon",
      weight: w("ribbon"),
      length: num(state, "ribbon.length"),
      thickness: num(state, "ribbon.thickness"),
      waves: num(state, "ribbon.waves"),
    });
  }

  if (on("path")) {
    const box = num(state, "path.viewBox");
    shapes.push({
      type: "path",
      weight: w("path"),
      size: s("path"),
      path: str(state, "path.d"),
      viewBox: [box, box],
    });
  }

  const emoji = splitList(str(state, "emoji.list"));

  if (on("emoji") && emoji.length > 0) {
    shapes.push({ type: "emoji", weight: w("emoji"), size: s("emoji"), emoji: oneOrList(emoji) });
  }

  const words = splitList(str(state, "text.list"));

  if (on("text") && words.length > 0) {
    const fontFamily = str(state, "text.fontFamily");
    shapes.push({
      type: "text",
      weight: w("text"),
      size: s("text"),
      text: oneOrList(words),
      fontWeight: num(state, "text.fontWeight"),
      ...(fontFamily === "" ? {} : { fontFamily }),
    });
  }

  if (on("image")) {
    const source = str(state, "image.src");
    const upload = str(state, "image.upload");
    const src =
      source === "upload" && upload !== ""
        ? upload
        : source === "demo url"
          ? assets.coinUrl
          : source === "inline svg"
            ? DEMO_SVG
            : assets.coinCanvas;
    shapes.push({ type: "image", weight: w("image"), size: s("image"), src });
  }

  if (on("sprite")) {
    shapes.push({
      type: "spritesheet",
      weight: w("sprite"),
      size: s("sprite"),
      src: str(state, "sprite.src") === "demo url" ? assets.sheetUrl : assets.sheetCanvas,
      frames: { cols: assets.sheetFrames, rows: 1 },
      fps: num(state, "sprite.fps"),
      loop: bool(state, "sprite.loop"),
      randomStartFrame: bool(state, "sprite.randomStart"),
    });
  }

  return shapes;
}

/**
 * Inline SVG Offered as an Image Source (a string starting with `<svg` is used as markup).
 */
const DEMO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#d6ff3f" stroke="#0b0d10" stroke-width="1" d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>';

/**
 * Build Physics Options.
 *
 * @param state - Control State
 * @returns Physics Options
 */
function buildPhysics(state: ControlState): PhysicsOptions {
  return {
    gravity: num(state, "gravity"),
    drag: num(state, "drag"),
    wind: num(state, "wind"),
    ...(bool(state, "useTerminal") ? { terminalVelocity: num(state, "terminalVelocity") } : {}),
    swirl: bool(state, "swirl")
      ? { strength: num(state, "swirlStrength"), frequency: num(state, "swirlFrequency") }
      : false,
    floor: bool(state, "floor")
      ? {
          y: num(state, "floorY"),
          bounce: num(state, "floorBounce"),
          friction: num(state, "floorFriction"),
        }
      : false,
    attract: bool(state, "attract") ? buildAttract(state) : false,
  };
}

/**
 * Normalized Points Offered as Attractor Targets (besides the pointer).
 */
const ATTRACT_POINTS: Readonly<Record<string, OriginPoint>> = {
  center: { x: 0.5, y: 0.5 },
  "top center": { x: 0.5, y: 0.15 },
};

/**
 * Build Attractor Options.
 *
 * @param state - Control State
 * @returns Attractor Options
 */
function buildAttract(state: ControlState): AttractOptions {
  const radius = num(state, "attractRadius");

  return {
    target: ATTRACT_POINTS[str(state, "attractTarget")] ?? "pointer",
    strength: num(state, "attractStrength"),
    // 0 on the slider means "no limit"
    ...(radius > 0 ? { radius } : {}),
    falloff: str(state, "attractFalloff") === "linear" ? "linear" : "constant",
  };
}

/**
 * Build Formation Options.
 *
 * @param state - Control State
 * @param assets - Demo Images
 * @returns Formation Options
 */
function buildFormation(state: ControlState, assets: DemoAssets): FormationOptions {
  const mode = str(state, "formationMode") === "appear" ? "appear" : "assemble";
  const common = {
    mode,
    hold: num(state, "formationHold"),
    spacing: num(state, "formationSpacing"),
    fit: num(state, "formationFit"),
    ...(mode === "assemble"
      ? {
          assemble: num(state, "formationAssemble"),
          easing: easing(state, "formationEasing"),
        }
      : {}),
  } as const;

  if (str(state, "formationSource") === "image") {
    const upload = str(state, "formationUpload");

    return {
      ...common,
      image:
        str(state, "formationImage") === "upload" && upload !== "" ? upload : assets.logoCanvas,
      width: num(state, "formationWidth"),
      imageColors: bool(state, "formationImageColors"),
    };
  }

  // the input is single-line, so a typed backslash + n starts a new line
  const text = str(state, "formationText").replace(/\\n/g, "\n");

  return {
    ...common,
    text: text.trim() === "" ? "KONFETI" : text,
    font: str(state, "formationFont"),
  };
}

/**
 * Build Fire Options from Controls.
 *
 * @param state - Control State
 * @param assets - Demo Images
 * @param settings - Build Switches
 * @returns Fire Options (without hooks)
 */
export function buildOptions(
  state: ControlState,
  assets: DemoAssets,
  settings: BuildSettings = {},
): FireOptions {
  const lifetime = num(state, "lifetime");
  const jitter = num(state, "lifetimeJitter");
  const originX = num(state, "originX");
  const originSpread = num(state, "originSpreadX");
  const isFormation = settings.includeFormation !== false && bool(state, "formation");
  // a formation is a single burst whose particle count follows from its spacing
  const emission = isFormation ? undefined : buildEmission(state);
  const shapes = buildShapes(state, assets);

  return {
    ...(isFormation ? {} : { particleCount: num(state, "particleCount") }),
    angle: num(state, "angle"),
    spread: num(state, "spread"),
    startVelocity: isFormation
      ? [num(state, "formationVelocityMin"), num(state, "formationVelocityMax")]
      : [num(state, "velocityMin"), num(state, "velocityMax")],
    lifetime: [Math.round(lifetime * (1 - jitter)), Math.round(lifetime * (1 + jitter))],
    ...(settings.includeOrigin === false
      ? {}
      : {
          origin: {
            x: originSpread > 0 ? [originX - originSpread, originX + originSpread] : originX,
            y: num(state, "originY"),
          },
        }),
    ...(emission === undefined ? {} : { emission }),
    ...(num(state, "delay") > 0 ? { delay: num(state, "delay") } : {}),
    ...(bool(state, "useSeed") ? { seed: num(state, "seed") } : {}),
    paper: buildPaper(state),
    ...(shapes.length > 0 ? { shapes } : {}),
    physics: buildPhysics(state),
    ...(isFormation ? { formation: buildFormation(state, assets) } : {}),
  };
}
