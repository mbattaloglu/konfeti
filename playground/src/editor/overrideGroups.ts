import type { Control, PaletteControl } from "../controlTypes";
import { GEOMETRY_GROUPS, STYLE_GROUPS } from "./styleModel";
import type { GeometryKey, StyleKey } from "./styleModel";

/**
 * Card Prefix of the Paper Shape, the One Card that Can Also Override Paper Geometry.
 */
export const PAPER_PREFIX = "paper";

/**
 * Key Suffix of a Card's List of Own Style Groups (`star.styles`).
 */
const STYLES_SUFFIX = "styles";

/**
 * Option Path Prefix of the Base Style Controls.
 */
const PAPER_PARAM = "paper.";

/**
 * Option Path Prefix of a Shape Entry's Own Settings.
 */
const SHAPE_PARAM = "shapes[].";

/**
 * Key of the Colors Control (its override clone must keep at least one color).
 */
const COLORS_KEY = "colors";

/**
 * Fewest Colors of a Colors Override: an empty one would mean "inherit", which removing the group already does.
 */
const MIN_OVERRIDE_COLORS = 1;

/**
 * Shape Type of Each Card Prefix that Differs from It.
 */
const SHAPE_TYPES: Readonly<Record<string, string>> = { sprite: "spritesheet" };

/**
 * One Group a Card Can Override: a `PaperGeometry` key (paper card only) or a `ShapeStyle` key.
 */
export type OverrideGroup =
  | {
      /**
       * Group Kind.
       */
      readonly kind: "geometry";
      /**
       * Paper Geometry Key.
       */
      readonly key: GeometryKey;
      /**
       * Base Control Keys of the Group.
       */
      readonly controls: readonly string[];
    }
  | {
      /**
       * Group Kind.
       */
      readonly kind: "style";
      /**
       * Style Key.
       */
      readonly key: StyleKey;
      /**
       * Base Control Keys of the Group.
       */
      readonly controls: readonly string[];
    };

/**
 * Every Override Group in Canonical Order: geometry first, then the `DEFAULT_STYLE` order.
 */
export const OVERRIDE_GROUPS: readonly OverrideGroup[] = [
  ...GEOMETRY_GROUPS.map((group): OverrideGroup => ({
    kind: "geometry",
    key: group.key,
    controls: group.controls,
  })),
  ...STYLE_GROUPS.map((group): OverrideGroup => ({
    kind: "style",
    key: group.key,
    controls: group.controls,
  })),
];

/**
 * Style-Only Groups (every card but paper).
 */
const STYLE_ONLY_GROUPS = OVERRIDE_GROUPS.filter((group) => group.kind === "style");

/**
 * List the Groups a Card Can Override.
 * Geometry on other entries is ignored by the library, so only the paper card offers it.
 *
 * @param prefix - Card Prefix
 * @returns Groups in Canonical Order
 */
export function overrideGroupsFor(prefix: string): readonly OverrideGroup[] {
  return prefix === PAPER_PREFIX ? OVERRIDE_GROUPS : STYLE_ONLY_GROUPS;
}

/**
 * Find One Group of a Card.
 *
 * @param prefix - Card Prefix
 * @param groupKey - Group Key
 * @returns Group, or Undefined When the Card Cannot Override It
 */
export function overrideGroupOf(prefix: string, groupKey: string): OverrideGroup | undefined {
  return overrideGroupsFor(prefix).find((group) => group.key === groupKey);
}

/**
 * Build the State Key of a Card's List of Own Style Groups.
 *
 * @param prefix - Card Prefix
 * @returns State Key (`star.styles`)
 */
export function stylesKey(prefix: string): string {
  return `${prefix}.${STYLES_SUFFIX}`;
}

/**
 * Build the State Key of One Override Control.
 *
 * @param prefix - Card Prefix
 * @param baseKey - Key of the Base Control
 * @returns State Key (`star.trailLength`)
 */
export function overrideKey(prefix: string, baseKey: string): string {
  return `${prefix}.${baseKey}`;
}

/**
 * Map a Card Prefix to Its Shape Type.
 *
 * @param prefix - Card Prefix
 * @returns Shape Type (`sprite` → `spritesheet`)
 */
export function shapeTypeOf(prefix: string): string {
  return SHAPE_TYPES[prefix] ?? prefix;
}

/**
 * Clean a List of Group Keys: known groups of the card only, each once, in canonical order.
 *
 * @param prefix - Card Prefix
 * @param value - Any Value (a list from the state, a share link or the loader)
 * @returns Group Keys
 */
export function canonicalStyles(prefix: string, value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const listed = new Set<unknown>(value);

  return overrideGroupsFor(prefix)
    .map((group) => group.key)
    .filter((key) => listed.has(key));
}

/**
 * List the State Keys of a Card's Listed Groups.
 *
 * @param prefix - Card Prefix
 * @param styles - Listed Group Keys
 * @returns Pairs of Override Key and Base Control Key
 */
export function listedOverrideKeys(
  prefix: string,
  styles: readonly string[],
): readonly (readonly [key: string, baseKey: string])[] {
  return overrideGroupsFor(prefix)
    .filter((group) => styles.includes(group.key))
    .flatMap((group) =>
      group.controls.map((baseKey) => [overrideKey(prefix, baseKey), baseKey] as const),
    );
}

/**
 * Turn a Base `paper.*` Option Path into the Shape Entry's Path.
 *
 * @param param - Option Path of the Base Control
 * @returns Option Path on a Shape Entry
 */
function shapeParam(param: string): string {
  return param.startsWith(PAPER_PARAM) ? SHAPE_PARAM + param.slice(PAPER_PARAM.length) : param;
}

/**
 * Copy a Base Control for a Card's Override Group.
 * The key gets the card prefix, the option path points at the shape entry, and a condition on another control of
 * the same group follows that control's copy; a condition on a control outside the group is dropped (only the
 * aspect ratio's "Use Aspect Ratio"). A colors copy keeps at least one color.
 *
 * @param control - Base Control (already localized)
 * @param prefix - Card Prefix
 * @param groupControls - Base Control Keys of the Group
 * @returns Override Control
 */
export function cloneForOverride(
  control: Control,
  prefix: string,
  groupControls: readonly string[],
): Control {
  const { when, ...rest } = control;
  const parent = when?.[0];
  const clone: Control = {
    ...rest,
    key: overrideKey(prefix, control.key),
    param: shapeParam(control.param),
    ...(when !== undefined && parent !== undefined && groupControls.includes(parent)
      ? { when: [overrideKey(prefix, parent), when[1]] as const }
      : {}),
  };

  return clone.kind === "palette" && control.key === COLORS_KEY
    ? ({ ...clone, minItems: MIN_OVERRIDE_COLORS } satisfies PaletteControl)
    : clone;
}
