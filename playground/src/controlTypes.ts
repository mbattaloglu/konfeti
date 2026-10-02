/**
 * Number Pair as [min, max].
 * State of a span control; min ≤ max after every write.
 */
export type NumberPair = readonly [min: number, max: number];

/**
 * Single Control Value.
 * String lists hold chips and palettes, number pairs hold spans.
 */
export type ControlValue = string | number | boolean | readonly string[] | NumberPair;

/**
 * Control State Keyed by Control Key.
 */
export type ControlState = Record<string, ControlValue>;

/**
 * Visibility Condition: control is active only while `state[key] === value`.
 */
export type ControlCondition = readonly [key: string, value: string | boolean];

/**
 * Numbers a Control Accepts.
 * Typed, shared and loaded values outside it are rejected: values the library throws on, or that stall the page.
 */
export type ValueDomain = {
  /**
   * Lower Bound.
   */
  readonly min: number;
  /**
   * Exclusive Lower Bound.
   * The value must be greater than `min`, not equal to it.
   */
  readonly exclusive?: true;
  /**
   * Upper Bound (inclusive).
   */
  readonly max?: number;
  /**
   * Bounds Checked after Math.floor.
   * The library floors these values before it validates them.
   */
  readonly floored?: true;
  /**
   * Zero Also Accepted.
   * Exactly 0 means "not set" for this control and is never sent.
   */
  readonly zeroAllowed?: true;
};

/**
 * Fields Shared by Every Control.
 */
type ControlBase = {
  /**
   * Unique State Key.
   */
  readonly key: string;
  /**
   * Human-Readable Title Case Label.
   */
  readonly label: string;
  /**
   * Real Option Path Shown in Code Font (e.g. `paper.cornerRadius`).
   */
  readonly param: string;
  /**
   * Short Tooltip Text.
   */
  readonly hint?: string;
  /**
   * Condition that Enables the Control.
   */
  readonly when?: ControlCondition;
  /**
   * Advanced-Only Control.
   * Hidden in Basic mode; its value stays in the state and keeps being sent.
   */
  readonly advanced?: true;
};

/**
 * Numeric Slider Control.
 */
export type RangeControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "range";
  /**
   * Slider Minimum.
   */
  readonly min: number;
  /**
   * Slider Maximum.
   */
  readonly max: number;
  /**
   * Slider Step.
   */
  readonly step: number;
  /**
   * Initial Value.
   */
  readonly initial: number;
  /**
   * Unit Suffix Shown After the Value.
   */
  readonly unit?: string;
  /**
   * Readout Text for 0.
   * Shown instead of "0" where 0 means "none / unlimited" (attract radius "∞").
   */
  readonly zeroLabel?: string;
  /**
   * Accepted Values.
   * Omitted when the library accepts every finite number.
   */
  readonly domain?: ValueDomain;
};

/**
 * Min–Max Slider Control.
 * Two thumbs on one track; the value is a single number when min === max.
 */
export type SpanControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "span";
  /**
   * Slider Minimum.
   * Typed values may go below it; the thumb then sits at the start.
   */
  readonly min: number;
  /**
   * Slider Maximum.
   * Typed values may go above it; the thumb then sits at the end.
   */
  readonly max: number;
  /**
   * Slider Step.
   * Typed values may be off this grid.
   */
  readonly step: number;
  /**
   * Initial Value (the library default where one exists).
   */
  readonly initial: NumberPair;
  /**
   * Unit Shown after the Readout.
   */
  readonly unit?: string;
  /**
   * Accepted Values (applies to both bounds).
   */
  readonly domain?: ValueDomain;
};

/**
 * Single-Choice Dropdown Control.
 */
export type SelectControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "select";
  /**
   * Available Options.
   */
  readonly options: readonly string[];
  /**
   * Initial Value.
   */
  readonly initial: string;
  /**
   * Options Listed Only in Advanced Mode.
   * In Basic mode they are left out of the dropdown, unless one of them is the current value.
   */
  readonly advancedOptions?: readonly string[];
  /**
   * Options the User Cannot Pick.
   * Rendered disabled; only a derived value selects them (the "custom" theme of `colorTheme`).
   */
  readonly derivedOptions?: readonly string[];
};

/**
 * On/Off Switch Control.
 */
export type ToggleControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "toggle";
  /**
   * Initial Value.
   */
  readonly initial: boolean;
};

/**
 * Free Text Control.
 */
export type TextControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "text";
  /**
   * Initial Value.
   */
  readonly initial: string;
  /**
   * Input Placeholder.
   */
  readonly placeholder?: string;
  /**
   * Write Only on Commit.
   * The value is written on Enter or when the field loses focus instead of on every keystroke, so a half-typed
   * URL is never loaded (URL fields).
   */
  readonly commitOn?: "change";
};

/**
 * Color Picker Control (hex value).
 */
export type ColorControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "color";
  /**
   * Initial Value.
   */
  readonly initial: string;
};

/**
 * Multi-Select Pill Control.
 */
export type ChipsControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "chips";
  /**
   * Available Options.
   */
  readonly options: readonly string[];
  /**
   * Initially Selected Options.
   */
  readonly initial: readonly string[];
};

/**
 * Editable Color List Control.
 * Each color is a swatch chip (click to pick, × to remove) plus a `+` button.
 */
export type PaletteControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "palette";
  /**
   * Initial Hex Colors.
   */
  readonly initial: readonly string[];
  /**
   * Text Shown when the List Is Empty (e.g. "Auto" or "Inherit").
   */
  readonly emptyLabel: string;
  /**
   * Fewest Colors.
   * The × buttons are disabled at this count (2 for gradient stops, 1 for a colors override).
   */
  readonly minItems?: number;
};

/**
 * File Picker Control (state holds an object URL, `""` when empty).
 */
export type FileControl = ControlBase & {
  /**
   * Control Kind.
   */
  readonly kind: "file";
  /**
   * Accepted MIME Types.
   */
  readonly accept: string;
};

/**
 * Any Playground Control.
 */
export type Control =
  | RangeControl
  | SpanControl
  | SelectControl
  | ToggleControl
  | TextControl
  | ColorControl
  | ChipsControl
  | PaletteControl
  | FileControl;

/**
 * Toggleable Card Inside a Section (used for shape types).
 */
export type ControlCard = {
  /**
   * Card Title.
   */
  readonly title: string;
  /**
   * Option Snippet Shown in Code Font.
   */
  readonly param: string;
  /**
   * State Key of the Enable Switch.
   */
  readonly enableKey: string;
  /**
   * Initial Enable State.
   */
  readonly initialEnabled: boolean;
  /**
   * Controls Shown While Enabled.
   */
  readonly controls: readonly Control[];
};

/**
 * Collapsible Control Section.
 */
export type ControlSection = {
  /**
   * Stable Id (used to remember open state).
   */
  readonly id: string;
  /**
   * Section Title.
   */
  readonly title: string;
  /**
   * Decorative Icon Glyph.
   */
  readonly icon: string;
  /**
   * Short Section Description.
   */
  readonly description?: string;
  /**
   * Open by Default.
   */
  readonly open?: boolean;
  /**
   * Flat Controls.
   */
  readonly controls: readonly Control[];
  /**
   * Toggleable Cards Rendered After the Controls.
   */
  readonly cards?: readonly ControlCard[];
  /**
   * Advanced-Only Section.
   * Every control in it is advanced (used by "hooks").
   */
  readonly advanced?: true;
  /**
   * Global Section.
   * Its keys are shared by all bursts (not per burst tab) and travel in the share link's `g`.
   */
  readonly global?: true;
};
