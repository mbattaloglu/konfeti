/**
 * Single Control Value (arrays hold multi-select chip values).
 */
export type ControlValue = string | number | boolean | readonly string[];

/**
 * Control State Keyed by Control Key.
 */
export type ControlState = Record<string, ControlValue>;

/**
 * Visibility Condition: control is active only while `state[key] === value`.
 */
export type ControlCondition = readonly [key: string, value: string | boolean];

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
};
