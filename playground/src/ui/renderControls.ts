import type {
  ChipsControl,
  ColorControl,
  Control,
  ControlCard,
  ControlSection,
  ControlState,
  ControlValue,
  FileControl,
  NumberPair,
  PaletteControl,
  RangeControl,
  SelectControl,
  SpanControl,
  TextControl,
  ToggleControl,
  ValueDomain,
} from "../controlTypes";
import { isActiveIn } from "../editor/conditions";
import { createControlIndex } from "../editor/controlIndex";
import type { EditorMode } from "../editor/editorMode";
import {
  asList,
  formatExact,
  inDomain,
  isNumberPair,
  parseNumberEntry,
  parseSpanEntry,
} from "../editor/optionValues";
import { t } from "../i18n/messages";
import { splitList } from "../stateReaders";
import { readableTextColor } from "./colorContrast";
import { el } from "./dom";
import { createHint } from "./hintTooltip";
import { optionLabel } from "./optionLabel";
import { createSectionIcon } from "./sectionIcons";

/**
 * Called with the Changed State Key (`"*"` after a reset or a load).
 */
export type ChangeListener = (key: string) => void;

/**
 * State Scope: the per-burst keys, or the global keys shared by every burst (the hooks).
 */
export type ControlScope = "burst" | "global";

/**
 * Options of a Single Value Write.
 */
export type SetValueOptions = {
  /**
   * Skip the Change Listener (derived values such as the color theme).
   */
  readonly silent?: true;
};

/**
 * Rendering Options.
 */
export type RenderOptions = {
  /**
   * Editor Mode to Start In.
   */
  readonly mode: EditorMode;
  /**
   * Element Whose `data-mode` Attribute Hides the Advanced Rows in Basic Mode (`#tab-controls`).
   */
  readonly modeRoot: HTMLElement;
};

/**
 * Imperative Access to Rendered Controls.
 */
export type ControlsHandle = {
  /**
   * Set a Control Value and Update Its Widget (the change listener runs unless `silent` is set).
   */
  readonly setValue: (key: string, value: ControlValue, options?: SetValueOptions) => void;
  /**
   * Restore Every Control of Both Scopes to Its Initial Value.
   */
  readonly reset: () => void;
  /**
   * Return the Current Value of Every Control in a Scope.
   */
  readonly capture: (scope: ControlScope) => Record<string, ControlValue>;
  /**
   * Show Values in a Scope; a key the values leave out goes back to its initial value.
   * The caller validates and normalizes the values first (applyBurstDiff, applyGlobalDiff).
   */
  readonly load: (scope: ControlScope, values: Readonly<Record<string, ControlValue>>) => void;
  /**
   * Switch Between Basic and Advanced (sets `data-mode` and rebuilds the dropdowns).
   */
  readonly setMode: (mode: EditorMode) => void;
};

/**
 * Writes a Widget Value into the State (then refreshes and notifies).
 */
type ValueWriter = (value: ControlValue) => void;

/**
 * Rendered Widget Binding.
 */
type Binding = {
  /**
   * Row Element (dimmed while inactive).
   */
  readonly row: HTMLElement;
  /**
   * Initial Value.
   */
  readonly initial: ControlValue;
  /**
   * Push a Value into the Widget.
   */
  readonly apply: (value: ControlValue) => void;
  /**
   * Enable or Disable the Widget Inputs.
   */
  readonly setDisabled: (disabled: boolean) => void;
  /**
   * Mode-Dependent Flag: the widget is re-applied when the editor mode changes (dropdowns with advanced options).
   */
  readonly followsMode?: true;
};

/**
 * Exact Value Typed into the Value Editor: the parsed value, or the fields that hold an invalid entry.
 */
type Entry<T extends ControlValue> =
  | {
      /**
       * Valid Entry Flag.
       */
      readonly valid: true;
      /**
       * Parsed Value.
       */
      readonly value: T;
    }
  | {
      /**
       * Valid Entry Flag.
       */
      readonly valid: false;
      /**
       * Indexes of the Offending Fields.
       */
      readonly invalid: readonly number[];
    };

/**
 * Exact Value Editor Settings (one field for a range, min and max for a span).
 */
type ValueEditorSpec<T extends ControlValue> = {
  /**
   * Readout Button the Editor Replaces While Open.
   */
  readonly button: HTMLButtonElement;
  /**
   * Accessible Name of Each Field.
   */
  readonly labels: readonly string[];
  /**
   * Starting Text of Each Field (the exact current value).
   */
  readonly texts: readonly string[];
  /**
   * Decimal Keypad Flag: only for controls that cannot go negative (the iOS keypad has no minus key).
   */
  readonly decimalKeypad: boolean;
  /**
   * Linked Fields Flag: the first field is copied into the second until the second is edited (a single value).
   */
  readonly linked: boolean;
  /**
   * Parse and Validate the Field Texts.
   */
  readonly parse: (texts: readonly string[]) => Entry<T>;
  /**
   * Write a Valid Value.
   */
  readonly commit: (value: T) => void;
};

/**
 * Value Readout in a Row Head (a button that opens the exact value editor).
 */
type Readout = {
  /**
   * Readout Button.
   */
  readonly button: HTMLButtonElement;
  /**
   * Readout Text Element.
   */
  readonly output: HTMLOutputElement;
};

/**
 * Pointer Drag Started on Two Overlapping Span Thumbs (centres closer than `overlapGapPx` for the pointer).
 */
type ThumbDrag = {
  /**
   * Pointer Id of the Drag.
   */
  readonly pointerId: number;
  /**
   * Pointer X Where the Drag Started.
   */
  readonly startX: number;
  /**
   * Displayed Minimum Thumb Value Where the Drag Started.
   */
  readonly startLow: number;
  /**
   * Displayed Maximum Thumb Value Where the Drag Started.
   */
  readonly startHigh: number;
  /**
   * Thumb Picked by the Drag Direction (null until the pointer moved far enough).
   */
  readonly picked: HTMLInputElement | null;
};

/**
 * Colors Offered by the Palette `+` Button (the library default palette).
 */
const NEW_COLOR_CYCLE: readonly string[] = [
  "#26ccff",
  "#a25afd",
  "#ff5e7e",
  "#88ff5a",
  "#fcff42",
  "#ffa62d",
  "#ff36ff",
  "#ffffff",
];

/**
 * Local Storage Key for Section Open State.
 */
const OPEN_STORAGE_KEY = "konfeti-playground:open-sections";

/**
 * Pointer Travel that Picks a Thumb When the Two Span Thumbs Overlap (left: min, right: max).
 */
const THUMB_PICK_THRESHOLD_PX = 3;

/**
 * Edge Length of a Slider Thumb (`.slider::-webkit-slider-thumb` in style.css).
 * The thumb center travels from half a thumb inside one end of the track to half a thumb inside the other.
 */
const THUMB_SIZE_PX = 12;

/**
 * Smallest Area Around a Touch the Browser Searches for Its Target, in Screen Pixels (Chrome's touch adjustment).
 * A touch grabs a thumb from up to half this area beside the thumb's edge.
 */
const TOUCH_AREA_MIN_PX = 20;

/**
 * Largest Area Around a Touch the Browser Searches for Its Target, in Screen Pixels (wider contacts are capped).
 */
const TOUCH_AREA_MAX_PX = 32;

/**
 * Pointer Button That Drags a Thumb (the main mouse button, a touch or a pen contact).
 */
const MAIN_BUTTON = 0;

/**
 * Percent of a Full Slider Track.
 */
const FULL_TRACK_PERCENT = 100;

/**
 * Text Between the Two Bounds of a Span Readout and Editor.
 */
const SPAN_SEPARATOR = "–";

/**
 * Read Remembered Open Sections.
 *
 * @returns Open Section Ids, or `null` when nothing is stored
 */
function readOpenSections(): Set<string> | null {
  try {
    const raw = localStorage.getItem(OPEN_STORAGE_KEY);

    return raw === null ? null : new Set(JSON.parse(raw) as string[]);
  } catch {
    return null;
  }
}

/**
 * Remember Open Sections.
 *
 * @param ids - Open Section Ids
 */
function writeOpenSections(ids: ReadonlySet<string>): void {
  try {
    localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // storage may be blocked (private mode); open state is only a convenience
  }
}

/**
 * Append a Unit to a Readout Text.
 *
 * @param text - Number Text
 * @param unit - Unit Suffix, if Any
 * @returns Text with the Unit after a Space
 */
function withUnit(text: string, unit: string | undefined): string {
  return unit === undefined ? text : `${text} ${unit}`;
}

/**
 * Return the Readout Text of a Single Slider Value.
 *
 * @param value - Exact Value
 * @param control - Range Control
 * @returns Zero Label for 0 When the Control Has One, Else the Exact Number with Its Unit
 */
function rangeText(value: number, control: RangeControl): string {
  return value === 0 && control.zeroLabel !== undefined
    ? control.zeroLabel
    : withUnit(formatExact(value), control.unit);
}

/**
 * Return a Value's Position on a Slider Track.
 *
 * @param value - Exact Value (may lie outside the slider bounds)
 * @param bounds - Slider Minimum and Maximum
 * @returns Percent of the Track, Clamped to 0–100
 */
function trackPercent(value: number, bounds: Pick<RangeControl, "min" | "max">): number {
  const extent = bounds.max - bounds.min;
  const ratio = extent > 0 ? (value - bounds.min) / extent : 0;

  return Math.min(Math.max(ratio, 0), 1) * FULL_TRACK_PERCENT;
}

/**
 * Read a Span State Value.
 *
 * @param value - State Value
 * @param fallback - Pair Used for Anything That Is Not a Number Pair
 * @returns Number Pair (`[n, n]` for a stray number)
 */
function toSpanPair(value: ControlValue, fallback: NumberPair): NumberPair {
  if (isNumberPair(value)) {
    return value;
  }

  return typeof value === "number" && Number.isFinite(value) ? [value, value] : fallback;
}

/**
 * Read a String List State Value.
 *
 * @param value - State Value
 * @returns The Strings of a List, Empty for Anything Else
 */
function toStringList(value: ControlValue): string[] {
  return (asList(value) ?? []).filter((item): item is string => typeof item === "string");
}

/**
 * Parse the Typed Fields of a Span Editor.
 *
 * @param minText - Typed Minimum
 * @param maxText - Typed Maximum
 * @param domain - Accepted Values of the Control
 * @returns Sorted Pair, or the Fields That Are Unparsable or Outside the Domain
 */
function parseSpanTexts(
  minText: string,
  maxText: string,
  domain: ValueDomain | undefined,
): Entry<NumberPair> {
  const pair = parseSpanEntry(minText, maxText);

  if (pair !== null && inDomain(domain, pair)) {
    return { valid: true, value: pair };
  }

  const texts = [minText, maxText];
  const allBlank = texts.every((text) => text.trim() === "");
  // an empty field only takes the other field's value, so it is the culprit only when both are empty
  const invalid = texts.flatMap((text, index) => {
    if (text.trim() === "") {
      return allBlank ? [index] : [];
    }

    const value = parseNumberEntry(text);

    return value === null || !inDomain(domain, value) ? [index] : [];
  });

  return { valid: false, invalid: invalid.length > 0 ? invalid : [0, 1] };
}

/**
 * Open the Exact Value Editor in Place of a Readout Button.
 * Enter commits a valid entry (an invalid one stays open, marked `aria-invalid`), Escape cancels, and moving the
 * focus out of the editor commits a valid entry or reverts an invalid one. A valid entry is written exactly: no
 * clamping to the slider bounds and no snapping to its step.
 *
 * @param spec - Editor Settings
 */
function openValueEditor<T extends ControlValue>(spec: ValueEditorSpec<T>): void {
  const box = el("span", "value-editor");
  const fields = spec.labels.map((label, index) => {
    const input = el("input", "value-input");
    input.type = "text";
    input.spellcheck = false;
    input.autocomplete = "off";
    input.value = spec.texts[index] ?? "";
    input.setAttribute("aria-label", label);

    if (spec.decimalKeypad) {
      input.inputMode = "decimal";
    }

    return input;
  });
  const [first, second] = fields;

  for (const [index, field] of fields.entries()) {
    if (index > 0) {
      box.append(el("span", "value-separator", SPAN_SEPARATOR));
    }

    box.append(field);
  }

  // a long label and the open editor may not fit one line in a narrow panel; the head wraps while editing
  const head = spec.button.parentElement;
  let linked = spec.linked;
  let closed = false;

  const unmark = (): void => {
    for (const field of fields) {
      field.removeAttribute("aria-invalid");
    }
  };

  const finish = (value: T | null, refocus: boolean): void => {
    // removing the focused field may fire focusout again; the editor is already done by then
    closed = true;

    if (value !== null) {
      spec.commit(value);
    }

    box.replaceWith(spec.button);
    head?.classList.remove("is-editing");

    if (refocus) {
      spec.button.focus();
    }
  };

  first?.addEventListener("input", () => {
    // a single value edited in the min field stays a single value until the max field is edited itself
    if (linked && second !== undefined) {
      second.value = first.value;
    }

    unmark();
  });
  second?.addEventListener("input", () => {
    linked = false;
    unmark();
  });

  box.addEventListener("keydown", (event) => {
    if (event.isComposing) {
      return;
    }

    if (event.key === "Enter") {
      // also suppresses the keypress, which would otherwise click the readout button focused below
      event.preventDefault();
      const entry = spec.parse(fields.map((field) => field.value));

      if (entry.valid) {
        finish(entry.value, true);
        return;
      }

      for (const [index, field] of fields.entries()) {
        if (entry.invalid.includes(index)) {
          field.setAttribute("aria-invalid", "true");
        } else {
          field.removeAttribute("aria-invalid");
        }
      }

      // the editor stays open on the first field to fix
      fields.find((field) => field.hasAttribute("aria-invalid"))?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(null, true);
    }
  });

  box.addEventListener("focusout", (event) => {
    const next = event.relatedTarget;

    // moving between the two fields keeps the editor open
    if (closed || (next instanceof Node && box.contains(next))) {
      return;
    }

    const entry = spec.parse(fields.map((field) => field.value));
    // the focus went elsewhere on purpose, so it stays there
    finish(entry.valid ? entry.value : null, false);
  });

  head?.classList.add("is-editing");
  spec.button.replaceWith(box);
  first?.focus();
  first?.select();
}

/**
 * Create the Value Readout of a Slider Row (a button holding the `output`; a click edits the value exactly).
 *
 * @param label - Control Label
 * @returns Readout Button and Text Element
 */
function createReadout(label: string): Readout {
  const button = el("button", "control-value-edit");
  const output = el("output", "control-value");
  button.type = "button";
  button.setAttribute("aria-label", t("value.edit", { label }));
  button.append(output);

  return { button, output };
}

/**
 * Build Label Row (Title Case label + code param + optional hint).
 *
 * @param control - Control Definition
 * @returns Head Element
 */
function renderHead(control: Pick<Control, "label" | "param" | "hint">): HTMLElement {
  const head = el("div", "control-head");
  const label = el("span", "control-label", control.label);
  const param = el("code", "control-param", control.param);
  // a long readout can cut the path short with an ellipsis; hovering shows it in full
  param.title = control.param;
  head.append(label, param);

  if (control.hint !== undefined) {
    head.append(createHint(control.hint, t("hint.label", { label: control.label })));
  }

  return head;
}

/**
 * Render Slider Control.
 *
 * @param control - Range Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderRange(control: RangeControl, write: ValueWriter): Binding {
  const row = el("div", "control control--range");
  const head = renderHead(control);
  const readout = createReadout(control.label);
  const input = el("input", "slider");
  input.type = "range";
  input.min = String(control.min);
  input.max = String(control.max);
  input.step = String(control.step);
  input.setAttribute("aria-label", control.label);
  head.append(readout.button);
  row.append(head, input);
  let current = control.initial;

  const apply = (value: ControlValue): void => {
    current = typeof value === "number" ? value : Number(value);
    const text = rangeText(current, control);
    // the browser clamps and snaps the thumb; the state and the readout keep the exact number
    input.value = String(current);
    input.style.setProperty("--fill", `${String(trackPercent(current, control))}%`);
    input.setAttribute("aria-valuetext", text);
    readout.output.textContent = text;
  };

  const commit = (value: number): void => {
    apply(value);
    write(value);
  };

  input.addEventListener("input", () => {
    commit(input.valueAsNumber);
  });
  readout.button.addEventListener("click", () => {
    openValueEditor<number>({
      button: readout.button,
      labels: [t("value.edit", { label: control.label })],
      texts: [formatExact(current)],
      decimalKeypad: control.min >= 0,
      linked: false,
      parse: ([text = ""]) => {
        const value = parseNumberEntry(text);

        return value !== null && inDomain(control.domain, value)
          ? { valid: true, value }
          : { valid: false, invalid: [0] };
      },
      commit,
    });
  });

  return {
    row,
    initial: control.initial,
    apply,
    setDisabled: (disabled) => {
      input.disabled = disabled;
      readout.button.disabled = disabled;
    },
  };
}

/**
 * Return Page Scale (below 1 while a phone shows the 1024 px wide layout zoomed out).
 *
 * @returns Visual Viewport Scale, or 1 Where the Browser Reports None
 */
function pageScale(): number {
  const scale = window.visualViewport?.scale ?? 1;

  return scale > 0 ? scale : 1;
}

/**
 * Return Centre Gap Below Which Two Span Thumbs Count as Overlapping for a Press.
 * A mouse or pen hits only the drawn thumb; a touch also grabs a thumb from beside it.
 *
 * @param event - Pointer Down Event
 * @returns Gap in CSS Pixels
 */
function overlapGapPx(event: PointerEvent): number {
  if (event.pointerType !== "touch") {
    return THUMB_SIZE_PX;
  }

  // the browser routes a touch to the nearest target inside an area around the finger: the contact width, kept
  // between two sizes in screen pixels, so wider in CSS pixels on a zoomed-out page. Closer than one thumb plus
  // that area, a touch between the thumbs reaches both and grabs whichever the browser picks
  const scale = pageScale();
  const area = Math.min(
    Math.max(event.width, TOUCH_AREA_MIN_PX / scale),
    TOUCH_AREA_MAX_PX / scale,
  );

  return THUMB_SIZE_PX + area;
}

/**
 * Create One Thumb of a Span Slider (a native range input).
 *
 * @param control - Span Control
 * @param bound - Which Bound the Thumb Moves
 * @param label - Accessible Name
 * @returns Range Input
 */
function createThumb(control: SpanControl, bound: "min" | "max", label: string): HTMLInputElement {
  const thumb = el("input", "slider span-thumb");
  thumb.type = "range";
  thumb.min = String(control.min);
  thumb.max = String(control.max);
  thumb.step = String(control.step);
  thumb.dataset["thumb"] = bound;
  thumb.setAttribute("aria-label", label);

  return thumb;
}

/**
 * Render Min–Max Slider Control (two thumbs on one track; a single value when both meet).
 *
 * @param control - Span Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderSpan(control: SpanControl, write: ValueWriter): Binding {
  const row = el("div", "control control--span");
  const head = renderHead(control);
  const readout = createReadout(control.label);
  const track = el("div", "span-slider");
  const low = createThumb(control, "min", t("span.min", { label: control.label }));
  const high = createThumb(control, "max", t("span.max", { label: control.label }));
  head.append(readout.button);
  track.append(low, high);
  row.append(head, track);
  let current: NumberPair = control.initial;
  let drag: ThumbDrag | null = null;

  const apply = (value: ControlValue): void => {
    current = toSpanPair(value, control.initial);
    const [lo, hi] = current;
    // the browser clamps and snaps both thumbs; the state and the readout keep the exact numbers
    low.value = String(lo);
    high.value = String(hi);
    track.style.setProperty("--from", `${String(trackPercent(lo, control))}%`);
    track.style.setProperty("--to", `${String(trackPercent(hi, control))}%`);
    low.setAttribute("aria-valuetext", withUnit(formatExact(lo), control.unit));
    high.setAttribute("aria-valuetext", withUnit(formatExact(hi), control.unit));
    readout.output.textContent = withUnit(
      lo === hi ? formatExact(lo) : `${formatExact(lo)} ${SPAN_SEPARATOR} ${formatExact(hi)}`,
      control.unit,
    );
  };

  const commit = (pair: NumberPair): void => {
    apply(pair);
    write(pair);
  };

  // each thumb stops at the other bound, which keeps its exact (possibly typed, off-grid) value
  const moveLow = (): void => {
    commit([Math.min(low.valueAsNumber, current[1]), current[1]]);
  };
  const moveHigh = (): void => {
    commit([current[0], Math.max(high.valueAsNumber, current[0])]);
  };

  const raise = (thumb: HTMLInputElement): void => {
    low.classList.toggle("is-top", thumb === low);
    high.classList.toggle("is-top", thumb === high);
  };

  // the pixels the thumb centres travel along the track (half a thumb inside each end)
  const travelPx = (): number => track.getBoundingClientRect().width - THUMB_SIZE_PX;

  // the distance between the two drawn thumb centres
  const thumbGap = (): number => {
    const extent = control.max - control.min;

    return extent > 0
      ? ((high.valueAsNumber - low.valueAsNumber) / extent) * Math.max(travelPx(), 0)
      : 0;
  };

  for (const thumb of [low, high]) {
    thumb.addEventListener("focus", () => {
      raise(thumb);
    });
    thumb.addEventListener("pointerdown", (event) => {
      raise(thumb);

      // apart, each thumb drags natively; while the drawn thumbs overlap, a press on the visible block mostly
      // grabs the upper thumb, and on top of each other neither native drag could move both ways. A touch
      // reaches past the drawn thumb, so for a touch close thumbs overlap sooner (a native touch drag that starts
      // between them jumps the grabbed thumb to the finger and can slide it onto the other bound)
      if (thumb.disabled || event.button !== MAIN_BUTTON || thumbGap() >= overlapGapPx(event)) {
        return;
      }

      // focused as a native press would, so the arrow keys work after a plain click too
      event.preventDefault();
      thumb.focus({ preventScroll: true });
      thumb.setPointerCapture(event.pointerId);
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startLow: low.valueAsNumber,
        startHigh: high.valueAsNumber,
        picked: null,
      };
    });
  }

  // while an overlap drag runs, only the picked thumb may change the value
  low.addEventListener("input", () => {
    if (drag === null || drag.picked === low) {
      moveLow();
    } else {
      apply(current);
    }
  });
  high.addEventListener("input", () => {
    if (drag === null || drag.picked === high) {
      moveHigh();
    } else {
      apply(current);
    }
  });

  track.addEventListener("pointermove", (event) => {
    if (drag?.pointerId !== event.pointerId) {
      return;
    }

    let picked = drag.picked;
    const moved = event.clientX - drag.startX;
    const travel = travelPx();

    if (picked === null) {
      if (Math.abs(moved) < THUMB_PICK_THRESHOLD_PX) {
        return;
      }

      picked = moved < 0 ? low : high;
      drag = { ...drag, picked };
      picked.focus({ preventScroll: true });
    }

    if (travel <= 0) {
      return;
    }

    const previous = picked.valueAsNumber;
    // the picked thumb follows the pointer from where it started (no jump to the pointer inside a wide block);
    // setting the value lets the browser clamp and snap it, exactly as a native drag would
    const start = picked === low ? drag.startLow : drag.startHigh;
    picked.value = String(start + (moved / travel) * (control.max - control.min));

    // a native drag fires input only on a change: a move that leaves the thumb where it was (clamped at an end)
    // must not rewrite the exact bounds
    if (picked.valueAsNumber === previous) {
      return;
    }

    if (picked === low) {
      moveLow();
    } else {
      moveHigh();
    }
  });

  const endDrag = (event: PointerEvent): void => {
    if (drag?.pointerId === event.pointerId) {
      drag = null;
    }
  };

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  track.addEventListener("lostpointercapture", endDrag);
  // a native slider also follows touch events, which a canceled pointerdown does not stop
  track.addEventListener(
    "touchstart",
    (event) => {
      if (drag !== null) {
        event.preventDefault();
      }
    },
    { passive: false },
  );

  readout.button.addEventListener("click", () => {
    openValueEditor<NumberPair>({
      button: readout.button,
      labels: [t("span.min", { label: control.label }), t("span.max", { label: control.label })],
      texts: [formatExact(current[0]), formatExact(current[1])],
      decimalKeypad: control.min >= 0,
      linked: current[0] === current[1],
      parse: ([minText = "", maxText = ""]) => parseSpanTexts(minText, maxText, control.domain),
      commit,
    });
  });

  return {
    row,
    initial: control.initial,
    apply,
    setDisabled: (disabled) => {
      low.disabled = disabled;
      high.disabled = disabled;
      readout.button.disabled = disabled;
    },
  };
}

/**
 * Render Dropdown Control.
 * The listed options follow the mode and the value: advanced options appear in Advanced mode or while one of them
 * is the value, and derived options are listed disabled (only a derived value selects them).
 *
 * @param control - Select Control
 * @param write - Value Writer
 * @param mode - Returns the Current Editor Mode
 * @returns Binding
 */
function renderSelect(control: SelectControl, write: ValueWriter, mode: () => EditorMode): Binding {
  const row = el("div", "control control--select");
  const input = el("select", "select");
  const advanced = control.advancedOptions ?? [];
  const derived = control.derivedOptions ?? [];
  let listed: readonly string[] = [];

  const list = (value: string): void => {
    const shown = [
      ...control.options,
      ...(mode() === "advanced" || advanced.includes(value) ? advanced : []),
      ...derived,
    ];

    // rebuilding an unchanged list would only reset the dropdown for nothing
    if (
      shown.length === listed.length &&
      shown.every((option, index) => option === listed[index])
    ) {
      return;
    }

    listed = shown;
    input.replaceChildren(
      ...shown.map((option) => {
        // the value stays the library value; only the visible text is humanized
        const item = el("option", undefined, optionLabel(option));
        item.value = option;
        item.disabled = derived.includes(option);

        return item;
      }),
    );
  };

  row.append(renderHead(control), input);
  input.addEventListener("change", () => {
    write(input.value);
  });

  return {
    row,
    initial: control.initial,
    apply: (value) => {
      const text = String(value);
      list(text);
      input.value = text;
    },
    setDisabled: (disabled) => (input.disabled = disabled),
    followsMode: true,
  };
}

/**
 * Create Pill Switch Input.
 *
 * @returns Wrapper and Checkbox
 */
function createSwitch(): { wrapper: HTMLElement; input: HTMLInputElement } {
  const wrapper = el("span", "switch");
  const input = el("input");
  input.type = "checkbox";
  wrapper.append(input, el("span", "switch-track"));

  return { wrapper, input };
}

/**
 * Render Switch Control.
 *
 * @param control - Toggle Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderToggle(control: ToggleControl, write: ValueWriter): Binding {
  const row = el("label", "control control--toggle");
  const { wrapper, input } = createSwitch();
  row.append(renderHead(control), wrapper);
  input.addEventListener("change", () => {
    write(input.checked);
  });

  return {
    row,
    initial: control.initial,
    apply: (value) => (input.checked = value === true),
    setDisabled: (disabled) => (input.disabled = disabled),
  };
}

/**
 * Render Text Control (color lists get a swatch preview).
 *
 * @param control - Text Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderText(control: TextControl, write: ValueWriter): Binding {
  const row = el("div", "control control--text");
  const input = el("input", "text-input");
  input.type = "text";
  input.spellcheck = false;

  if (control.placeholder !== undefined) {
    input.placeholder = control.placeholder;
  }

  row.append(renderHead(control), input);
  const swatches = control.param.toLowerCase().includes("color") ? el("div", "swatches") : null;

  if (swatches !== null) {
    row.append(swatches);
  }

  const paint = (value: string): void => {
    if (swatches === null) {
      return;
    }

    swatches.replaceChildren(
      ...splitList(value)
        .filter((entry) => entry !== "auto")
        .map((entry) => {
          const swatch = el("span", "swatch");
          swatch.style.background = entry;
          swatch.title = entry;

          return swatch;
        }),
    );
  };

  input.addEventListener("input", () => {
    paint(input.value);
    write(input.value);
  });

  return {
    row,
    initial: control.initial,
    apply: (value) => {
      input.value = String(value);
      paint(input.value);
    },
    setDisabled: (disabled) => (input.disabled = disabled),
  };
}

/**
 * Create Clickable Color Chip (the chip itself is the picker trigger).
 *
 * @param onPick - Called with the Picked Hex Color
 * @returns Chip Element, Hidden Color Input and Painter
 */
function createColorChip(onPick: (hex: string) => void): {
  chip: HTMLLabelElement;
  input: HTMLInputElement;
  paint: (hex: string) => void;
} {
  const chip = el("label", "color-chip");
  const input = el("input", "color-chip-input");
  const code = el("code", "color-chip-code");
  input.type = "color";
  chip.append(input, code);

  const paint = (hex: string): void => {
    input.value = hex;
    chip.style.setProperty("--chip-color", hex);
    chip.style.setProperty("--chip-text", readableTextColor(hex));
    code.textContent = hex;
    chip.title = `${hex} · click to edit`;
  };

  input.addEventListener("input", () => {
    paint(input.value);
    onPick(input.value);
  });

  return { chip, input, paint };
}

/**
 * Render Single Color Control.
 *
 * @param control - Color Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderColor(control: ColorControl, write: ValueWriter): Binding {
  const row = el("div", "control control--color");
  const head = renderHead(control);
  const { chip, input, paint } = createColorChip((hex) => {
    write(hex);
  });
  head.append(chip);
  row.append(head);

  return {
    row,
    initial: control.initial,
    apply: (value) => {
      paint(String(value));
    },
    setDisabled: (disabled) => (input.disabled = disabled),
  };
}

/**
 * Pick Next Color for the `+` Button (cycles the library palette, skipping used colors).
 *
 * @param used - Colors Already in the List
 * @returns Hex Color
 */
function nextColor(used: readonly string[]): string {
  return NEW_COLOR_CYCLE.find((hex) => !used.includes(hex)) ?? NEW_COLOR_CYCLE[0] ?? "#ffffff";
}

/**
 * Render Editable Color List.
 *
 * @param control - Palette Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderPalette(control: PaletteControl, write: ValueWriter): Binding {
  const row = el("div", "control control--palette");
  const list = el("div", "palette");
  const empty = el("span", "palette-empty", control.emptyLabel);
  const add = el("button", "palette-add", "+");
  const fewest = control.minItems ?? 0;
  add.type = "button";
  add.title = t("palette.add");
  add.setAttribute("aria-label", t("palette.addTo", { label: control.label }));
  row.append(renderHead(control), list);
  let colors: string[] = [];
  let disabled = false;

  const commit = (): void => {
    write([...colors]);
  };

  const render = (openIndex = -1): void => {
    const items = colors.map((hex, index) => {
      const item = el("span", "palette-item");
      const { chip, input, paint } = createColorChip((picked) => {
        colors[index] = picked;
        commit();
      });
      const remove = el("button", "palette-remove", "×");
      remove.type = "button";
      remove.title = t("palette.remove");
      remove.setAttribute("aria-label", t("palette.removeHex", { hex }));
      remove.addEventListener("click", () => {
        colors.splice(index, 1);
        render();
        commit();
      });
      input.disabled = disabled;
      // a list with a minimum (gradient stops) cannot shrink below it
      remove.disabled = disabled || colors.length <= fewest;
      paint(hex);
      item.append(chip, remove);

      if (index === openIndex) {
        // open the native picker right away for a freshly added color
        requestAnimationFrame(() => {
          input.click();
        });
      }

      return item;
    });

    list.replaceChildren(...(items.length === 0 ? [empty] : items), add);
  };

  add.addEventListener("click", () => {
    colors.push(nextColor(colors));
    render(colors.length - 1);
    commit();
  });

  return {
    row,
    initial: control.initial,
    apply: (value) => {
      colors = toStringList(value);
      render();
    },
    setDisabled: (value) => {
      disabled = value;
      add.disabled = value;
      render();
    },
  };
}

/**
 * Render Multi-Select Pill Control.
 * The value keeps the order in which the options were picked (a loaded `paper.form` list keeps its order).
 *
 * @param control - Chips Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderChips(control: ChipsControl, write: ValueWriter): Binding {
  const row = el("div", "control control--chips");
  const group = el("div", "chips");
  let selected: readonly string[] = [];
  const buttons = control.options.map((option) => {
    const button = el("button", "chip", optionLabel(option));
    button.type = "button";
    button.dataset["value"] = option;

    return button;
  });

  const press = (): void => {
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(selected.includes(button.dataset["value"] ?? "")));
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const value = button.dataset["value"] ?? "";
      // a newly pressed option goes to the end; the buttons themselves never move
      selected = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      press();
      write(selected);
    });
  }

  group.append(...buttons);
  row.append(renderHead(control), group);

  return {
    row,
    initial: control.initial,
    apply: (value) => {
      selected = toStringList(value);
      press();
    },
    setDisabled: (disabled) => {
      for (const button of buttons) {
        button.disabled = disabled;
      }
    },
  };
}

/**
 * Render File Picker Control (stores an object URL).
 * Object URLs are never revoked: the same upload can stay in use (a shared burst, a later reload of its value).
 *
 * @param control - File Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderFile(control: FileControl, write: ValueWriter): Binding {
  const row = el("div", "control control--file");
  const picker = el("label", "file-button");
  const input = el("input");
  const preview = el("img", "file-preview");
  const name = el("span", "file-name", t("file.none"));
  input.type = "file";
  input.accept = control.accept;
  picker.append(input, el("span", undefined, t("file.choose")));
  const body = el("div", "file-row");
  body.append(picker, preview, name);
  row.append(renderHead(control), body);

  const apply = (value: ControlValue): void => {
    const url = typeof value === "string" ? value : "";
    preview.hidden = url === "";
    preview.src = url;

    if (url === "") {
      name.textContent = t("file.none");
      input.value = "";
    }
  };

  input.addEventListener("change", () => {
    const chosen = input.files?.[0];

    if (chosen === undefined) {
      return;
    }

    const url = URL.createObjectURL(chosen);
    apply(url);
    name.textContent = chosen.name;
    write(url);
  });

  return {
    row,
    initial: "",
    apply,
    setDisabled: (disabled) => (input.disabled = disabled),
  };
}

/**
 * Render Any Control.
 *
 * @param control - Control Definition
 * @param write - Value Writer
 * @param mode - Returns the Current Editor Mode
 * @returns Binding
 */
function renderControl(control: Control, write: ValueWriter, mode: () => EditorMode): Binding {
  switch (control.kind) {
    case "range":
      return renderRange(control, write);
    case "span":
      return renderSpan(control, write);
    case "select":
      return renderSelect(control, write, mode);
    case "toggle":
      return renderToggle(control, write);
    case "text":
      return renderText(control, write);
    case "color":
      return renderColor(control, write);
    case "chips":
      return renderChips(control, write);
    case "palette":
      return renderPalette(control, write);
    case "file":
      return renderFile(control, write);
  }
}

/**
 * Render Controls into a Section, Cards Included.
 *
 * @param section - Section Definition
 * @param bind - Registers a Control and Returns Its Row
 * @param bindCard - Registers a Card Switch and Returns Its Element
 * @returns Section Element and Its Badge
 */
function renderSection(
  section: ControlSection,
  bind: (control: Control) => HTMLElement,
  bindCard: (card: ControlCard) => HTMLElement,
): { details: HTMLDetailsElement; badge: HTMLElement } {
  const details = el("details", "section");
  const summary = el("summary", "section-summary");
  const badge = el("span", "section-badge");
  details.dataset["section"] = section.id;

  if (section.advanced === true) {
    details.dataset["advanced"] = "";
  }

  const icon = el("span", "section-icon");
  icon.append(createSectionIcon(section.id, section.icon));
  summary.append(
    icon,
    el("span", "section-title", section.title),
    badge,
    el("span", "section-chevron"),
  );
  const body = el("div", "section-body");

  if (section.description !== undefined) {
    body.append(el("p", "section-description", section.description));
  }

  for (const control of section.controls) {
    body.append(bind(control));
  }

  if (section.cards !== undefined) {
    const grid = el("div", "cards");

    for (const card of section.cards) {
      grid.append(bindCard(card));
    }

    body.append(grid);
  }

  details.append(summary, body);

  return { details, badge };
}

/**
 * Render the Declarative Control Table.
 *
 * @param root - Container Element
 * @param sections - Control Table (localized)
 * @param state - Mutable Control State of Both Scopes (filled with initial values)
 * @param onChange - Change Listener
 * @param options - Starting Editor Mode and the Element That Carries It
 * @returns Controls Handle
 */
export function renderControls(
  root: HTMLElement,
  sections: readonly ControlSection[],
  state: ControlState,
  onChange: ChangeListener,
  options: RenderOptions,
): ControlsHandle {
  const index = createControlIndex(sections);
  const bindings = new Map<string, Binding>();
  const scopes = new Map<string, ControlScope>();
  // last activity shown per key, so a refresh only touches rows whose activity changed
  const shownActive = new Map<string, boolean>();
  const badges: { badge: HTMLElement; cards: readonly ControlCard[] }[] = [];
  const remembered = readOpenSections();
  const open = new Set(
    remembered ?? sections.filter((section) => section.open === true).map((section) => section.id),
  );
  let mode = options.mode;
  options.modeRoot.dataset["mode"] = mode;

  const refresh = (): void => {
    for (const [key, binding] of bindings) {
      // a control is active when its condition chain holds and, on a card, the card is on
      const active = isActiveIn(state, key, index);

      if (shownActive.get(key) !== active) {
        shownActive.set(key, active);
        binding.row.classList.toggle("is-inactive", !active);
        binding.setDisabled(!active);
      }
    }

    for (const { badge, cards } of badges) {
      const enabled = cards.filter((card) => state[card.enableKey] === true).length;
      badge.textContent =
        enabled === 0 ? t("shapes.paperOnly") : t("shapes.enabled", { count: enabled });
      badge.classList.toggle("is-on", enabled > 0);
    }
  };

  const register = (key: string, binding: Binding, scope: ControlScope): HTMLElement => {
    bindings.set(key, binding);
    scopes.set(key, scope);
    // lets tests (and devtools) find a control by its state key
    binding.row.dataset["key"] = key;
    state[key] = binding.initial;
    binding.apply(binding.initial);

    return binding.row;
  };

  const writer =
    (key: string) =>
    (value: ControlValue): void => {
      state[key] = value;
      refresh();
      onChange(key);
    };

  const bind = (control: Control, section: ControlSection): HTMLElement => {
    const binding = renderControl(control, writer(control.key), () => mode);

    // hidden in Basic mode by CSS; the value stays in the state and keeps being built
    if (control.advanced === true || section.advanced === true) {
      binding.row.dataset["advanced"] = "";
    }

    return register(control.key, binding, section.global === true ? "global" : "burst");
  };

  const bindCard = (card: ControlCard, section: ControlSection): HTMLElement => {
    const element = el("div", "card");
    const header = el("label", "card-header");
    const { wrapper, input } = createSwitch();
    const titles = el("span", "card-titles");
    const cardParam = el("code", "control-param", card.param);
    cardParam.title = card.param;
    titles.append(el("span", "card-title", card.title), cardParam);
    header.append(titles, wrapper);
    const body = el("div", "card-body");
    const write = writer(card.enableKey);
    const apply = (value: ControlValue): void => {
      input.checked = value === true;
      element.classList.toggle("is-enabled", input.checked);
    };

    input.addEventListener("change", () => {
      apply(input.checked);
      write(input.checked);
    });
    register(
      card.enableKey,
      {
        row: element,
        initial: card.initialEnabled,
        apply,
        setDisabled: (disabled) => (input.disabled = disabled),
      },
      section.global === true ? "global" : "burst",
    );

    for (const control of card.controls) {
      body.append(bind(control, section));
    }

    element.append(header, body);

    return element;
  };

  for (const section of sections) {
    const { details, badge } = renderSection(
      section,
      (control) => bind(control, section),
      (card) => bindCard(card, section),
    );
    details.open = open.has(section.id);
    details.addEventListener("toggle", () => {
      if (details.open) {
        open.add(section.id);
      } else {
        open.delete(section.id);
      }

      writeOpenSections(open);
    });

    if (section.cards !== undefined) {
      badges.push({ badge, cards: section.cards });
    }

    root.append(details);
  }

  refresh();

  return {
    setValue: (key, value, settings = {}) => {
      const binding = bindings.get(key);

      if (binding === undefined) {
        return;
      }

      state[key] = value;
      binding.apply(value);
      refresh();

      if (settings.silent !== true) {
        onChange(key);
      }
    },
    reset: () => {
      for (const [key, binding] of bindings) {
        state[key] = binding.initial;
        binding.apply(binding.initial);
      }

      refresh();
      onChange("*");
    },
    capture: (scope) => {
      const values: Record<string, ControlValue> = {};

      for (const [key, binding] of bindings) {
        if (scopes.get(key) === scope) {
          values[key] = state[key] ?? binding.initial;
        }
      }

      return values;
    },
    load: (scope, values) => {
      for (const [key, binding] of bindings) {
        if (scopes.get(key) !== scope) {
          continue;
        }

        const value = values[key] ?? binding.initial;
        state[key] = value;
        binding.apply(value);
      }

      refresh();
      onChange("*");
    },
    setMode: (next) => {
      mode = next;
      options.modeRoot.dataset["mode"] = next;

      // dropdowns list their advanced options only in Advanced mode (or while one of them is the value)
      for (const [key, binding] of bindings) {
        if (binding.followsMode === true) {
          binding.apply(state[key] ?? binding.initial);
        }
      }
    },
  };
}
