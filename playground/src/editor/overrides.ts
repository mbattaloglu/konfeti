import { buildMinimalPaper } from "../buildOptions";
import type { Control, ControlSection, ControlState, ControlValue } from "../controlTypes";
import {
  cloneForOverride,
  overrideGroupOf,
  overrideGroupsFor,
  overrideKey,
  shapeTypeOf,
} from "./overrideGroups";
import { inheritedStyle, writeStyle } from "./styleModel";

/**
 * One Group a Card Can Add, Ready to Render.
 */
export type OverrideTemplate = {
  /**
   * Group Key (`"trail"`).
   */
  readonly key: string;
  /**
   * Label Shown in the Picker and on the Group (the label of the group's first base control).
   */
  readonly label: string;
  /**
   * Copies of the Group's Base Controls, Keyed for the Card.
   */
  readonly controls: readonly Control[];
};

/**
 * What the Controls Renderer Needs to Offer Per-Card Overrides.
 */
export type OverrideSource = {
  /**
   * List the Groups a Card Can Add.
   */
  readonly groupsFor: (prefix: string) => readonly OverrideTemplate[];
  /**
   * Starting Values of a Group Just Added to a Card (what the shape gets right now, so adding changes nothing).
   */
  readonly startValues: (
    prefix: string,
    groupKey: string,
  ) => Readonly<Record<string, ControlValue>>;
};

/**
 * Index the Static Controls of the Sections by Key.
 *
 * @param sections - Control Sections (localized)
 * @returns Controls by Key
 */
function staticControls(sections: readonly ControlSection[]): ReadonlyMap<string, Control> {
  return new Map(
    sections.flatMap((section) => section.controls.map((control) => [control.key, control])),
  );
}

/**
 * Compute the Starting Values of a Group Added to a Card.
 * Every key of the group starts as its base control shows it; a style group then takes what the shape really
 * inherits (a shape default under an untouched base value, such as an emoji's "no flip").
 *
 * @param prefix - Card Prefix
 * @param groupKey - Group Key
 * @param state - Live Burst State
 * @returns Override Values by State Key
 */
export function overrideStartValues(
  prefix: string,
  groupKey: string,
  state: Readonly<ControlState>,
): Record<string, ControlValue> {
  const group = overrideGroupOf(prefix, groupKey);
  const values: Record<string, ControlValue> = {};

  if (group === undefined) {
    return values;
  }

  for (const baseKey of group.controls) {
    const value = state[baseKey];

    if (value !== undefined) {
      values[overrideKey(prefix, baseKey)] = value;
    }
  }

  if (group.kind === "style") {
    const inherited = inheritedStyle(group.key, shapeTypeOf(prefix), buildMinimalPaper(state));

    for (const [baseKey, value] of Object.entries(writeStyle(group.key, inherited))) {
      values[overrideKey(prefix, baseKey)] = value;
    }
  }

  return values;
}

/**
 * Create the Override Source the Controls Renderer Uses.
 *
 * @param sections - Control Sections (localized, so the copies need no translation of their own)
 * @param state - Live Burst State
 * @returns Override Source
 */
export function createOverrideSource(
  sections: readonly ControlSection[],
  state: Readonly<ControlState>,
): OverrideSource {
  const controls = staticControls(sections);
  const templates = new Map<string, readonly OverrideTemplate[]>();

  const build = (prefix: string): readonly OverrideTemplate[] =>
    overrideGroupsFor(prefix).flatMap((group) => {
      const base = group.controls.map((key) => controls.get(key));
      const [first] = base;

      if (first === undefined || base.some((control) => control === undefined)) {
        return [];
      }

      return [
        {
          key: group.key,
          label: first.label,
          controls: base.flatMap((control) =>
            control === undefined ? [] : [cloneForOverride(control, prefix, group.controls)],
          ),
        },
      ];
    });

  return {
    groupsFor: (prefix) => {
      const cached = templates.get(prefix);

      if (cached !== undefined) {
        return cached;
      }

      const built = build(prefix);
      templates.set(prefix, built);

      return built;
    },
    startValues: (prefix, groupKey) => overrideStartValues(prefix, groupKey, state),
  };
}
