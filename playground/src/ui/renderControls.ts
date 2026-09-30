import type {
  ChipsControl,
  ColorControl,
  Control,
  ControlCard,
  ControlCondition,
  ControlSection,
  ControlState,
  ControlValue,
  FileControl,
  PaletteControl,
  RangeControl,
  SelectControl,
  TextControl,
  ToggleControl,
} from "../controlTypes";
import { t } from "../i18n/messages";
import { splitList } from "../stateReaders";
import { readableTextColor } from "./colorContrast";
import { el } from "./dom";
import { createHint } from "./hintTooltip";
import { optionLabel } from "./optionLabel";
import { createSectionIcon } from "./sectionIcons";

/**
 * Called with the Changed State Key (`"*"` after a full reset).
 */
export type ChangeListener = (key: string) => void;

/**
 * Imperative Access to Rendered Controls.
 */
export type ControlsHandle = {
  /**
   * Set a Control Value and Update Its Widget.
   */
  readonly setValue: (key: string, value: ControlValue) => void;
  /**
   * Restore Every Control to Its Initial Value.
   */
  readonly reset: () => void;
  /**
   * Return the Values that Differ from the Initial Ones (local-only values such as picked files excluded).
   */
  readonly snapshot: () => Record<string, ControlValue>;
  /**
   * Apply Values from a Snapshot; unknown keys and values of the wrong type are ignored.
   */
  readonly restore: (values: Readonly<Record<string, unknown>>) => void;
};

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
   * Enable Condition.
   */
  readonly when?: ControlCondition;
  /**
   * Value Only Makes Sense in This Browser (object URLs of picked files), so share links skip it.
   */
  readonly isLocal?: true;
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
 * Format Slider Value for Display.
 *
 * @param value - Raw Value
 * @param step - Slider Step
 * @returns Display Text
 */
function formatNumber(value: number, step: number): string {
  const decimals = step >= 1 ? 0 : Math.min(3, String(step).split(".")[1]?.length ?? 2);

  return value.toFixed(decimals);
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
function renderRange(control: RangeControl, write: (value: ControlValue) => void): Binding {
  const row = el("div", "control control--range");
  const head = renderHead(control);
  const output = el("output", "control-value");
  const input = el("input", "slider");
  input.type = "range";
  input.min = String(control.min);
  input.max = String(control.max);
  input.step = String(control.step);
  head.append(output);
  row.append(head, input);

  const apply = (value: ControlValue): void => {
    const number = Number(value);
    const fill = ((number - control.min) / (control.max - control.min)) * 100;
    input.value = String(number);
    input.style.setProperty("--fill", `${fill}%`);
    output.textContent = `${formatNumber(number, control.step)}${control.unit === undefined ? "" : ` ${control.unit}`}`;
  };

  input.addEventListener("input", () => {
    apply(input.valueAsNumber);
    write(input.valueAsNumber);
  });

  return {
    row,
    initial: control.initial,
    apply,
    setDisabled: (disabled) => (input.disabled = disabled),
    ...(control.when === undefined ? {} : { when: control.when }),
  };
}

/**
 * Render Dropdown Control.
 *
 * @param control - Select Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderSelect(control: SelectControl, write: (value: ControlValue) => void): Binding {
  const row = el("div", "control control--select");
  const input = el("select", "select");

  for (const option of control.options) {
    // the value stays the library value; only the visible text is humanized
    const item = el("option", undefined, optionLabel(option));
    item.value = option;
    input.append(item);
  }

  row.append(renderHead(control), input);
  input.addEventListener("change", () => {
    write(input.value);
  });

  return {
    row,
    initial: control.initial,
    apply: (value) => (input.value = String(value)),
    setDisabled: (disabled) => (input.disabled = disabled),
    ...(control.when === undefined ? {} : { when: control.when }),
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
function renderToggle(control: ToggleControl, write: (value: ControlValue) => void): Binding {
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
    ...(control.when === undefined ? {} : { when: control.when }),
  };
}

/**
 * Render Text Control (color lists get a swatch preview).
 *
 * @param control - Text Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderText(control: TextControl, write: (value: ControlValue) => void): Binding {
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
    ...(control.when === undefined ? {} : { when: control.when }),
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
function renderColor(control: ColorControl, write: (value: ControlValue) => void): Binding {
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
    ...(control.when === undefined ? {} : { when: control.when }),
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
function renderPalette(control: PaletteControl, write: (value: ControlValue) => void): Binding {
  const row = el("div", "control control--palette");
  const list = el("div", "palette");
  const empty = el("span", "palette-empty", control.emptyLabel);
  const add = el("button", "palette-add", "+");
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
      remove.disabled = disabled;
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
      colors = Array.isArray(value) ? [...(value as readonly string[])] : [];
      render();
    },
    setDisabled: (value) => {
      disabled = value;
      add.disabled = value;
      render();
    },
    ...(control.when === undefined ? {} : { when: control.when }),
  };
}

/**
 * Render Multi-Select Pill Control.
 *
 * @param control - Chips Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderChips(control: ChipsControl, write: (value: ControlValue) => void): Binding {
  const row = el("div", "control control--chips");
  const group = el("div", "chips");
  const buttons = control.options.map((option) => {
    const button = el("button", "chip", optionLabel(option));
    button.type = "button";
    button.dataset["value"] = option;

    return button;
  });

  const selected = (): string[] =>
    buttons
      .filter((button) => button.getAttribute("aria-pressed") === "true")
      .map((button) => button.dataset["value"] ?? "");

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const pressed = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!pressed));
      write(selected());
    });
  }

  group.append(...buttons);
  row.append(renderHead(control), group);

  return {
    row,
    initial: control.initial,
    apply: (value) => {
      const values = Array.isArray(value) ? (value as readonly string[]) : [];

      for (const button of buttons) {
        button.setAttribute("aria-pressed", String(values.includes(button.dataset["value"] ?? "")));
      }
    },
    setDisabled: (disabled) => {
      for (const button of buttons) {
        button.disabled = disabled;
      }
    },
    ...(control.when === undefined ? {} : { when: control.when }),
  };
}

/**
 * Render File Picker Control (stores an object URL).
 *
 * @param control - File Control
 * @param write - Value Writer
 * @returns Binding
 */
function renderFile(control: FileControl, write: (value: ControlValue) => void): Binding {
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
  let current = "";

  const apply = (value: ControlValue): void => {
    const url = String(value);

    if (current !== "" && current !== url) {
      URL.revokeObjectURL(current);
    }

    current = url;
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
    isLocal: true,
    apply,
    setDisabled: (disabled) => (input.disabled = disabled),
    ...(control.when === undefined ? {} : { when: control.when }),
  };
}

/**
 * Render Any Control.
 *
 * @param control - Control Definition
 * @param write - Value Writer
 * @returns Binding
 */
function renderControl(control: Control, write: (value: ControlValue) => void): Binding {
  switch (control.kind) {
    case "range":
      return renderRange(control, write);
    case "select":
      return renderSelect(control, write);
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
 * @param sections - Control Table
 * @param state - Mutable Control State (filled with initial values)
 * @param onChange - Change Listener
 * @returns Controls Handle
 */
export function renderControls(
  root: HTMLElement,
  sections: readonly ControlSection[],
  state: ControlState,
  onChange: ChangeListener,
): ControlsHandle {
  const bindings = new Map<string, Binding>();
  const badges: { badge: HTMLElement; cards: readonly ControlCard[] }[] = [];
  const remembered = readOpenSections();
  const open = new Set(
    remembered ?? sections.filter((section) => section.open === true).map((section) => section.id),
  );

  /**
   * Check Whether a Control Is Active: its condition holds, and so does the condition of the control it
   * depends on (e.g. the formation text needs the text source, which needs the formation toggle).
   *
   * @param key - Control Key
   * @param depth - Chain Depth (guards against a condition loop)
   * @returns Active Flag
   */
  const isActive = (key: string, depth = 0): boolean => {
    const when = bindings.get(key)?.when;

    if (when === undefined || depth > bindings.size) {
      return true;
    }

    const [parent, expected] = when;
    return state[parent] === expected && isActive(parent, depth + 1);
  };

  const refresh = (): void => {
    for (const [key, binding] of bindings) {
      if (binding.when === undefined) {
        continue;
      }

      const active = isActive(key);
      binding.row.classList.toggle("is-inactive", !active);
      binding.setDisabled(!active);
    }

    for (const { badge, cards } of badges) {
      const enabled = cards.filter((card) => state[card.enableKey] === true).length;
      badge.textContent =
        enabled === 0 ? t("shapes.paperOnly") : t("shapes.enabled", { count: enabled });
      badge.classList.toggle("is-on", enabled > 0);
    }
  };

  const register = (key: string, binding: Binding): HTMLElement => {
    bindings.set(key, binding);
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

  const bind = (control: Control): HTMLElement =>
    register(control.key, renderControl(control, writer(control.key)));

  const bindCard = (card: ControlCard): HTMLElement => {
    const element = el("div", "card");
    const header = el("label", "card-header");
    const { wrapper, input } = createSwitch();
    const titles = el("span", "card-titles");
    titles.append(el("span", "card-title", card.title), el("code", "control-param", card.param));
    header.append(titles, wrapper);
    const body = el("div", "card-body");

    for (const control of card.controls) {
      body.append(bind(control));
    }

    element.append(header, body);
    const write = writer(card.enableKey);
    const apply = (value: ControlValue): void => {
      input.checked = value === true;
      element.classList.toggle("is-enabled", input.checked);
    };

    input.addEventListener("change", () => {
      apply(input.checked);
      write(input.checked);
    });
    register(card.enableKey, {
      row: element,
      initial: card.initialEnabled,
      apply,
      setDisabled: (disabled) => (input.disabled = disabled),
    });

    return element;
  };

  for (const section of sections) {
    const { details, badge } = renderSection(section, bind, bindCard);
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
    setValue: (key, value) => {
      const binding = bindings.get(key);

      if (binding === undefined) {
        return;
      }

      state[key] = value;
      binding.apply(value);
      refresh();
      onChange(key);
    },
    reset: () => {
      for (const [key, binding] of bindings) {
        state[key] = binding.initial;
        binding.apply(binding.initial);
      }

      refresh();
      onChange("*");
    },
    snapshot: () => {
      const changed: Record<string, ControlValue> = {};

      for (const [key, binding] of bindings) {
        const value = state[key];

        if (value !== undefined && binding.isLocal !== true && !sameValue(value, binding.initial)) {
          changed[key] = value;
        }
      }

      return changed;
    },
    restore: (values) => {
      for (const [key, value] of Object.entries(values)) {
        const binding = bindings.get(key);

        // a shared link is outside input: accept only values shaped like the control's own
        if (
          binding !== undefined &&
          binding.isLocal !== true &&
          isSameKind(value, binding.initial)
        ) {
          state[key] = value;
          binding.apply(value);
        }
      }

      refresh();
      onChange("*");
    },
  };
}

/**
 * Compare Two Control Values (arrays by content).
 *
 * @param a - First Value
 * @param b - Second Value
 * @returns Equal Flag
 */
function sameValue(a: ControlValue, b: ControlValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  return a === b;
}

/**
 * Check Whether an Untrusted Value Has the Same Kind as a Control's Initial Value.
 *
 * @param value - Untrusted Value
 * @param initial - Control's Initial Value
 * @returns Same-Kind Flag (narrowed to a control value)
 */
function isSameKind(value: unknown, initial: ControlValue): value is ControlValue {
  if (Array.isArray(initial)) {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
  }

  if (typeof initial === "number") {
    return typeof value === "number" && Number.isFinite(value);
  }

  return typeof value === typeof initial;
}
