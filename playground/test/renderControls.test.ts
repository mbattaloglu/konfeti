import { afterEach, describe, expect, it, vi } from "vitest";

import { buildInput } from "../src/buildOptions";
import { CONTROL_SECTIONS } from "../src/controls";
import type { ControlSection, ControlState } from "../src/controlTypes";
import {
  CONTROL_INDEX,
  initialBurst,
  initialGlobals,
  normalizeBurst,
} from "../src/editor/burstState";
import type { EditorMode } from "../src/editor/editorMode";
import { createOverrideSource } from "../src/editor/overrides";
import { renderControls } from "../src/ui/renderControls";
import type { ControlsHandle } from "../src/ui/renderControls";
import { createFakeAssets } from "./helpers/fakeAssets";

/**
 * Small Control Table with One Control of Each Kind the Renderer Treats Specially.
 */
const SECTIONS: readonly ControlSection[] = [
  {
    id: "main",
    title: "Main",
    icon: "•",
    open: true,
    controls: [
      {
        kind: "range",
        key: "radius",
        label: "Radius",
        param: "radius",
        min: 0,
        max: 10,
        step: 1,
        initial: 0,
        zeroLabel: "∞",
        domain: { min: 0 },
      },
      {
        kind: "span",
        key: "size",
        label: "Size",
        param: "size",
        min: 0,
        max: 100,
        step: 1,
        initial: [4, 4],
        unit: "px",
        domain: { min: 0, exclusive: true },
      },
      {
        kind: "select",
        key: "source",
        label: "Source",
        param: "source",
        options: ["a", "b"],
        advancedOptions: ["url"],
        initial: "a",
      },
      {
        kind: "select",
        key: "theme",
        label: "Theme",
        param: "theme",
        options: ["classic", "gold"],
        derivedOptions: ["custom"],
        initial: "classic",
      },
      {
        kind: "chips",
        key: "form",
        label: "Form",
        param: "form",
        options: ["rect", "circle", "leaf"],
        initial: ["rect"],
      },
      {
        kind: "palette",
        key: "stops",
        label: "Stops",
        param: "stops",
        initial: ["#000000", "#ffffff"],
        emptyLabel: "None",
        minItems: 2,
      },
      {
        kind: "toggle",
        key: "extra",
        label: "Extra",
        param: "extra",
        initial: false,
        advanced: true,
      },
      {
        kind: "range",
        key: "extraAmount",
        label: "Extra Amount",
        param: "extra.amount",
        min: 0,
        max: 1,
        step: 0.1,
        initial: 0.5,
        when: ["extra", true],
      },
    ],
  },
  {
    id: "hooks",
    title: "Hooks",
    icon: "⚡",
    global: true,
    advanced: true,
    controls: [{ kind: "toggle", key: "log", label: "Log", param: "log", initial: false }],
  },
];

/**
 * Stubbed Span Track Width: one 12 px thumb plus 100 px of travel, so 1 px moves the 0–100 `size` span by 1.
 */
const TRACK_WIDTH_PX = 112;

/**
 * Stubbed Span Track Height.
 */
const TRACK_HEIGHT_PX = 14;

/**
 * Pointer Id of the Drag Tests.
 */
const POINTER_ID = 1;

/**
 * Secondary (Right) Mouse Button Press.
 */
const SECONDARY: PointerEventInit = { button: 2 };

/**
 * Pen Contact.
 */
const PEN: PointerEventInit = { pointerType: "pen" };

/**
 * Touch Whose Contact Width the Browser Does Not Report (1 px, below the smallest touch area).
 */
const TOUCH: PointerEventInit = { pointerType: "touch" };

/**
 * Page Scale Close to a Phone's View of the 1024 px Wide Layout (390 / 1024 ≈ 0.38).
 */
const PHONE_PAGE_SCALE = 0.4;

/**
 * The Two Thumbs and the Track of the Test Span (`size`, 0–100).
 */
type SpanThumbs = {
  /**
   * Track Element.
   */
  readonly track: HTMLElement;
  /**
   * Minimum Thumb.
   */
  readonly low: HTMLInputElement;
  /**
   * Maximum Thumb.
   */
  readonly high: HTMLInputElement;
};

/**
 * Rendered Test Panel.
 */
type Panel = {
  /**
   * Controls Handle.
   */
  readonly controls: ControlsHandle;
  /**
   * Live State.
   */
  readonly state: ControlState;
  /**
   * Element Carrying `data-mode`.
   */
  readonly modeRoot: HTMLElement;
  /**
   * Keys Passed to the Change Listener, in Order.
   */
  readonly changes: string[];
  /**
   * Find an Element by Selector (throws when missing or of another type).
   */
  readonly find: <T extends Element>(selector: string, type: new () => T) => T;
};

/**
 * Render the Test Table into the Document.
 *
 * @param mode - Starting Editor Mode
 * @returns Test Panel
 */
function renderPanel(mode: EditorMode = "basic"): Panel {
  const modeRoot = document.createElement("div");
  const root = document.createElement("div");
  modeRoot.append(root);
  document.body.append(modeRoot);
  const state: ControlState = {};
  const changes: string[] = [];
  const controls = renderControls(
    root,
    SECTIONS,
    state,
    (key) => {
      changes.push(key);
    },
    { mode, modeRoot },
  );
  const find = <T extends Element>(selector: string, type: new () => T): T => {
    const found = modeRoot.querySelector(selector);

    if (!(found instanceof type)) {
      throw new Error(`missing ${selector}`);
    }

    return found;
  };

  return { controls, state, modeRoot, changes, find };
}

/**
 * Return the Option Values Listed by a Dropdown.
 *
 * @param select - Dropdown
 * @returns Option Values in Order
 */
function optionsOf(select: HTMLSelectElement): string[] {
  return [...select.options].map((option) => option.value);
}

/**
 * Type into a Field the Way a User Does (value, then an input event).
 *
 * @param field - Text Field
 * @param text - New Field Text
 */
function typeInto(field: HTMLInputElement, text: string): void {
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Press a Key on an Element.
 *
 * @param target - Focused Element
 * @param key - Key Name
 */
function press(target: Element, key: string): void {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

/**
 * Move a Thumb the Way the Browser Does for a Native Drag or a Key (value, then an input event).
 *
 * @param thumb - Range Input
 * @param value - New Slider Value
 */
function slide(thumb: HTMLInputElement, value: number): void {
  thumb.value = String(value);
  thumb.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Dispatch a Pointer Event of the Test Pointer.
 *
 * @param target - Event Target
 * @param type - Pointer Event Type
 * @param clientX - Pointer X
 * @param init - Other Event Fields (button, pointer type, contact width; a main-button mouse by default)
 * @returns The Dispatched Event
 */
function pointer(
  target: Element,
  type: string,
  clientX: number,
  init: PointerEventInit = {},
): PointerEvent {
  const event = new PointerEvent(type, {
    pointerId: POINTER_ID,
    clientX,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);

  return event;
}

/**
 * Dispatch a Touch Start on an Element.
 *
 * @param target - Event Target
 * @returns Canceled Flag
 */
function touchStart(target: Element): boolean {
  const event = new Event("touchstart", { bubbles: true, cancelable: true });
  target.dispatchEvent(event);

  return event.defaultPrevented;
}

/**
 * Return the Test Span's Thumbs, with a Laid-Out Track (happy-dom has no layout, so its box is stubbed).
 * On that track the pointer x of the value v is v + 6 (half a thumb).
 *
 * @param panel - Test Panel
 * @returns Track and Thumbs
 */
function spanThumbs(panel: Panel): SpanThumbs {
  const track = panel.find('[data-key="size"] .span-slider', HTMLElement);
  vi.spyOn(track, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, TRACK_WIDTH_PX, TRACK_HEIGHT_PX),
  );

  return {
    track,
    low: panel.find('[data-key="size"] [data-thumb="min"]', HTMLInputElement),
    high: panel.find('[data-key="size"] [data-thumb="max"]', HTMLInputElement),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  localStorage.clear();
});

describe("renderControls", () => {
  it("marks advanced rows and sections and sets the mode on the mode root", () => {
    const { modeRoot, find, controls } = renderPanel();

    expect(modeRoot.dataset["mode"]).toBe("basic");
    expect(find('[data-key="extra"]', HTMLElement).hasAttribute("data-advanced")).toBe(true);
    expect(find('[data-key="extraAmount"]', HTMLElement).hasAttribute("data-advanced")).toBe(false);
    expect(find('details[data-section="hooks"]', HTMLElement).hasAttribute("data-advanced")).toBe(
      true,
    );
    expect(find('details[data-section="main"]', HTMLElement).hasAttribute("data-advanced")).toBe(
      false,
    );

    controls.setMode("advanced");

    expect(modeRoot.dataset["mode"]).toBe("advanced");
  });

  it("lists advanced options in Advanced mode, or while one is the value", () => {
    const { controls, find } = renderPanel();
    const select = find('[data-key="source"] select', HTMLSelectElement);

    expect(optionsOf(select)).toEqual(["a", "b"]);

    controls.load("burst", { source: "url" });

    expect(optionsOf(select)).toEqual(["a", "b", "url"]);
    expect(select.value).toBe("url");

    controls.load("burst", { source: "b" });

    expect(optionsOf(select)).toEqual(["a", "b"]);

    controls.setMode("advanced");

    expect(optionsOf(select)).toEqual(["a", "b", "url"]);
    expect(select.value).toBe("b");

    controls.setMode("basic");

    expect(optionsOf(select)).toEqual(["a", "b"]);
  });

  it("lists derived options disabled and sets them silently", () => {
    const { controls, find, changes, state } = renderPanel();
    const select = find('[data-key="theme"] select', HTMLSelectElement);
    const custom = [...select.options].find((option) => option.value === "custom");

    expect(custom?.disabled).toBe(true);
    expect(select.value).toBe("classic");

    controls.setValue("theme", "custom", { silent: true });

    expect(select.value).toBe("custom");
    expect(state["theme"]).toBe("custom");
    expect(changes).toEqual([]);

    controls.setValue("theme", "gold");

    expect(changes).toEqual(["theme"]);
  });

  it("shows exact span and range readouts with units and zero labels", () => {
    const { controls, find } = renderPanel();
    const readout = find('[data-key="size"] output.control-value', HTMLElement);

    expect(readout.textContent).toBe("4 px");
    expect(find('[data-key="radius"] output.control-value', HTMLElement).textContent).toBe("∞");

    controls.load("burst", { size: [0.15000000000000002, 150], radius: 3 });

    expect(readout.textContent).toBe("0.15 – 150 px");
    expect(
      find('[data-key="size"] [data-thumb="min"]', HTMLElement).getAttribute("aria-valuetext"),
    ).toBe("0.15 px");
    expect(
      find('[data-key="size"] [data-thumb="max"]', HTMLElement).getAttribute("aria-valuetext"),
    ).toBe("150 px");
    // a value beyond the slider maximum pins the fill to the end of the track
    expect(find('[data-key="size"] .span-slider', HTMLElement).style.getPropertyValue("--to")).toBe(
      "100%",
    );
    expect(find('[data-key="radius"] output.control-value', HTMLElement).textContent).toBe("3");
  });

  it("names every slider and shows the full option path on hover", () => {
    const { find } = renderPanel();

    expect(
      find('[data-key="radius"] input.slider', HTMLInputElement).getAttribute("aria-label"),
    ).toBe("Radius");
    expect(
      find('[data-key="size"] [data-thumb="min"]', HTMLElement).getAttribute("aria-label"),
    ).toBe("Size minimum");
    expect(find('[data-key="size"] code.control-param', HTMLElement).title).toBe("size");
  });

  it("writes a typed range value exactly and keeps an invalid one out", () => {
    const { find, state } = renderPanel();
    find('[data-key="radius"] .control-value-edit', HTMLButtonElement).click();
    const field = find('[data-key="radius"] .value-input', HTMLInputElement);

    expect(field.value).toBe("0");
    expect(field.getAttribute("aria-label")).toBe("Edit Radius");
    expect(field.inputMode).toBe("decimal");

    typeInto(field, "12,5");
    press(field, "Enter");

    // outside the slider bounds and off its step, but inside the domain
    expect(state["radius"]).toBe(12.5);
    expect(find('[data-key="radius"] output.control-value', HTMLElement).textContent).toBe("12.5");
    expect(document.activeElement).toBe(
      find('[data-key="radius"] .control-value-edit', HTMLElement),
    );

    find('[data-key="radius"] .control-value-edit', HTMLButtonElement).click();
    const again = find('[data-key="radius"] .value-input', HTMLInputElement);
    typeInto(again, "-1");
    press(again, "Enter");

    expect(again.getAttribute("aria-invalid")).toBe("true");
    expect(again.isConnected).toBe(true);

    press(again, "Escape");

    expect(state["radius"]).toBe(12.5);
    expect(again.isConnected).toBe(false);
  });

  it("links the max field of a single-valued span until it is edited", () => {
    const { find, state } = renderPanel();
    find('[data-key="size"] .control-value-edit', HTMLButtonElement).click();
    const [low, high] = [...document.querySelectorAll<HTMLInputElement>(".value-input")];

    expect(low?.value).toBe("4");
    expect(high?.value).toBe("4");
    expect(low?.getAttribute("aria-label")).toBe("Size minimum");
    expect(high?.getAttribute("aria-label")).toBe("Size maximum");

    typeInto(low!, "9");

    expect(high?.value).toBe("9");

    press(low!, "Enter");

    expect(state["size"]).toEqual([9, 9]);

    find('[data-key="size"] .control-value-edit', HTMLButtonElement).click();
    const [min, max] = [...document.querySelectorAll<HTMLInputElement>(".value-input")];
    typeInto(min!, "1");
    typeInto(max!, "6");
    typeInto(min!, "2");

    expect(max?.value).toBe("6");

    press(min!, "Enter");

    expect(state["size"]).toEqual([2, 6]);

    // the domain excludes 0: only the offending field is marked
    find('[data-key="size"] .control-value-edit', HTMLButtonElement).click();
    const [bad, good] = [...document.querySelectorAll<HTMLInputElement>(".value-input")];
    typeInto(bad!, "0");
    press(bad!, "Enter");

    expect(bad?.getAttribute("aria-invalid")).toBe("true");
    expect(good?.hasAttribute("aria-invalid")).toBe(false);
    expect(state["size"]).toEqual([2, 6]);
  });

  it("commits a valid entry and reverts an invalid one when the focus leaves the editor", () => {
    const { find, state, changes } = renderPanel();
    const outside = document.createElement("button");
    document.body.append(outside);

    find('[data-key="radius"] .control-value-edit', HTMLButtonElement).click();
    const field = find('[data-key="radius"] .value-input', HTMLInputElement);
    typeInto(field, "7");
    outside.focus();

    expect(state["radius"]).toBe(7);
    expect(field.isConnected).toBe(false);
    // the focus went elsewhere on purpose, so it stays there
    expect(document.activeElement).toBe(outside);
    expect(changes).toEqual(["radius"]);

    find('[data-key="radius"] .control-value-edit', HTMLButtonElement).click();
    typeInto(find('[data-key="radius"] .value-input', HTMLInputElement), "-1");
    outside.focus();

    expect(state["radius"]).toBe(7);
    expect(changes).toEqual(["radius"]);

    // moving between the two fields of a span keeps the editor open
    find('[data-key="size"] .control-value-edit', HTMLButtonElement).click();
    const [low, high] = [...document.querySelectorAll<HTMLInputElement>(".value-input")];
    typeInto(low!, "9");
    high!.focus();

    expect(low!.isConnected).toBe(true);

    outside.focus();

    expect(state["size"]).toEqual([9, 9]);
    expect(low!.isConnected).toBe(false);
  });

  it("keeps chips in the order they were picked", () => {
    const { find, state, controls } = renderPanel();
    const chip = (value: string): HTMLButtonElement =>
      find(`[data-key="form"] .chip[data-value="${value}"]`, HTMLButtonElement);

    chip("circle").click();

    expect(state["form"]).toEqual(["rect", "circle"]);

    chip("rect").click();
    chip("rect").click();

    expect(state["form"]).toEqual(["circle", "rect"]);

    controls.load("burst", { form: ["leaf", "rect"] });
    chip("circle").click();

    expect(state["form"]).toEqual(["leaf", "rect", "circle"]);
    expect(chip("leaf").getAttribute("aria-pressed")).toBe("true");
  });

  it("disables removing palette colors at the minimum", () => {
    const { find } = renderPanel();
    const removeButtons = (): HTMLButtonElement[] => [
      ...find('[data-key="stops"]', HTMLElement).querySelectorAll<HTMLButtonElement>(
        ".palette-remove",
      ),
    ];

    expect(removeButtons().map((button) => button.disabled)).toEqual([true, true]);

    find('[data-key="stops"] .palette-add', HTMLButtonElement).click();

    expect(removeButtons().map((button) => button.disabled)).toEqual([false, false, false]);
  });

  it("captures, loads and resets each scope", () => {
    const { controls, state, changes } = renderPanel();

    expect(Object.keys(controls.capture("burst"))).not.toContain("log");
    expect(controls.capture("global")).toEqual({ log: false });

    controls.load("burst", { radius: 4 });
    controls.load("global", { log: true });

    expect(state["log"]).toBe(true);
    expect(state["radius"]).toBe(4);
    expect(state["size"]).toEqual([4, 4]);

    // a key the loaded values leave out goes back to its initial
    controls.load("burst", { size: [1, 2] });

    expect(state["radius"]).toBe(0);
    expect(state["log"]).toBe(true);

    controls.reset();

    expect(controls.capture("global")).toEqual({ log: false });
    expect(state["size"]).toEqual([4, 4]);
    expect(changes).toEqual(["*", "*", "*", "*"]);
  });

  it("disables a control while its condition does not hold", () => {
    const { controls, find } = renderPanel();
    const row = find('[data-key="extraAmount"]', HTMLElement);

    expect(row.classList.contains("is-inactive")).toBe(true);
    expect(find('[data-key="extraAmount"] .control-value-edit', HTMLButtonElement).disabled).toBe(
      true,
    );

    controls.setValue("extra", true);

    expect(row.classList.contains("is-inactive")).toBe(false);
    expect(find('[data-key="extraAmount"] input[type="range"]', HTMLInputElement).disabled).toBe(
      false,
    );
  });

  it("renders the real control table at the library defaults, in the canonical burst form", () => {
    const modeRoot = document.createElement("div");
    const root = document.createElement("div");
    modeRoot.append(root);
    document.body.append(modeRoot);
    const state: ControlState = {};
    const controls = renderControls(root, CONTROL_SECTIONS, state, () => undefined, {
      mode: "basic",
      modeRoot,
      overrides: createOverrideSource(CONTROL_SECTIONS, state),
    });
    const burst = controls.capture("burst");
    const spans = [...CONTROL_INDEX.entries.values()].filter(
      (entry) => entry.control.kind === "span",
    );

    expect(Object.keys(burst)).toEqual(expect.arrayContaining([...CONTROL_INDEX.burstKeys]));
    expect(Object.keys(burst)).toHaveLength(CONTROL_INDEX.burstKeys.length);
    expect(burst).toEqual(initialBurst());
    expect(normalizeBurst(burst)).toEqual(burst);
    expect(controls.capture("global")).toEqual(initialGlobals());
    expect(buildInput([burst], createFakeAssets())).toStrictEqual({});
    expect(root.querySelectorAll(".control--span")).toHaveLength(spans.length);
  });
});

describe("span thumbs", () => {
  it("move one bound each, never past the other, which keeps its exact value", () => {
    const panel = renderPanel();
    const { low, high } = spanThumbs(panel);
    const readout = panel.find('[data-key="size"] output.control-value', HTMLElement);

    panel.controls.load("burst", { size: [2, 6.37] });
    slide(low, 3);

    expect(panel.state["size"]).toEqual([3, 6.37]);

    slide(low, 50);

    expect(panel.state["size"]).toEqual([6.37, 6.37]);
    expect(readout.textContent).toBe("6.37 px");

    panel.controls.load("burst", { size: [2, 6.37] });
    slide(high, 1);

    expect(panel.state["size"]).toEqual([2, 2]);
    expect(panel.changes.at(-1)).toBe("size");
  });

  it("drag natively while apart, and only with the main button", () => {
    const panel = renderPanel();
    const { low, high } = spanThumbs(panel);

    panel.controls.load("burst", { size: [20, 60] });

    expect(pointer(low, "pointerdown", 26).defaultPrevented).toBe(false);
    expect(low.classList.contains("is-top")).toBe(true);
    expect(high.classList.contains("is-top")).toBe(false);

    panel.controls.load("burst", { size: [40, 40] });

    expect(pointer(high, "pointerdown", 46, SECONDARY).defaultPrevented).toBe(false);

    pointer(high, "pointermove", 20, SECONDARY);

    expect(panel.state["size"]).toEqual([40, 40]);
  });

  it("pick a thumb by the drag direction while they overlap", () => {
    const panel = renderPanel();
    const { track, low, high } = spanThumbs(panel);

    panel.controls.load("burst", { size: [40, 40] });

    expect(pointer(high, "pointerdown", 46).defaultPrevented).toBe(true);
    expect(high.hasPointerCapture(POINTER_ID)).toBe(true);

    // below the pick threshold nothing moves yet
    pointer(high, "pointermove", 47);

    expect(panel.state["size"]).toEqual([40, 40]);
    // a native slider would also follow the touch, so touches are held while the drag runs
    expect(touchStart(track)).toBe(true);

    pointer(high, "pointermove", 36);

    expect(panel.state["size"]).toEqual([30, 40]);
    expect(document.activeElement).toBe(low);

    // the thumb that was not picked cannot change the value
    slide(high, 90);

    expect(panel.state["size"]).toEqual([30, 40]);
    expect(high.value).toBe("40");

    // the picked thumb stops at the other bound
    pointer(high, "pointermove", 70);

    expect(panel.state["size"]).toEqual([40, 40]);

    pointer(high, "pointerup", 70);
    slide(high, 90);

    expect(panel.state["size"]).toEqual([40, 90]);
    expect(touchStart(track)).toBe(false);

    panel.controls.load("burst", { size: [40, 40] });
    pointer(high, "pointerdown", 46);
    pointer(high, "pointermove", 56);

    expect(panel.state["size"]).toEqual([40, 50]);
  });

  it("treat thumbs drawn closer than one thumb as overlapping", () => {
    const panel = renderPanel();
    const { low, high } = spanThumbs(panel);

    // 5 px apart: the press lands on the upper thumb, yet a drag to the left still moves the minimum
    panel.controls.load("burst", { size: [40, 45] });

    expect(pointer(high, "pointerdown", 51).defaultPrevented).toBe(true);

    pointer(high, "pointermove", 41);

    expect(panel.state["size"]).toEqual([30, 45]);

    pointer(high, "pointerup", 41);
    panel.controls.load("burst", { size: [40, 45] });
    pointer(low, "pointerdown", 46);
    pointer(low, "pointermove", 56);

    // the picked thumb moves by the pointer travel from where it started
    expect(panel.state["size"]).toEqual([40, 55]);

    pointer(low, "pointerup", 56);
    panel.controls.load("burst", { size: [40, 52] });

    // a full thumb apart, each thumb drags natively again
    expect(pointer(high, "pointerdown", 58).defaultPrevented).toBe(false);
  });

  it("treat close thumbs as overlapping for a touch, which also grabs a thumb from beside it", () => {
    const panel = renderPanel();
    const { track, low, high } = spanThumbs(panel);

    // 20 px apart: a mouse or pen press on the upper thumb drags it natively
    panel.controls.load("burst", { size: [40, 60] });

    expect(pointer(high, "pointerdown", 66).defaultPrevented).toBe(false);
    expect(pointer(high, "pointerdown", 66, PEN).defaultPrevented).toBe(false);

    // a touch between them reaches both thumbs, so the drag direction picks: left lowers only the minimum
    expect(pointer(high, "pointerdown", 56, TOUCH).defaultPrevented).toBe(true);
    expect(touchStart(track)).toBe(true);

    pointer(high, "pointermove", 46, TOUCH);

    expect(panel.state["size"]).toEqual([30, 60]);
    expect(document.activeElement).toBe(low);

    pointer(high, "pointerup", 46, TOUCH);
    panel.controls.load("burst", { size: [40, 60] });
    pointer(high, "pointerdown", 56, TOUCH);
    pointer(high, "pointermove", 66, TOUCH);

    // right raises only the maximum, by the finger's travel from where it started
    expect(panel.state["size"]).toEqual([40, 70]);
  });

  it("let a touch reach further with a wider contact and on a zoomed-out page", () => {
    const panel = renderPanel();
    const { high } = spanThumbs(panel);
    // a press halfway between the two thumbs, released again; true when it started the direction pick
    const press = (x: number, init: PointerEventInit): boolean => {
      const picks = pointer(high, "pointerdown", x, init).defaultPrevented;
      pointer(high, "pointerup", x, init);

      return picks;
    };

    // 35 px apart: beyond a small contact's reach (one thumb plus a 20 px area), within a 30 px contact's
    panel.controls.load("burst", { size: [40, 75] });

    expect(press(63.5, TOUCH)).toBe(false);
    expect(press(63.5, { ...TOUCH, width: 30 })).toBe(true);

    // wider contacts count as 32 px, so 45 px apart stays native even for a 100 px contact
    panel.controls.load("burst", { size: [40, 85] });

    expect(press(68.5, { ...TOUCH, width: 100 })).toBe(false);

    // zoomed out to 0.4, the 20 screen px area spans 50 CSS px: 45 px apart now overlap for a touch, not a mouse
    vi.stubGlobal("visualViewport", { scale: PHONE_PAGE_SCALE });

    expect(press(68.5, TOUCH)).toBe(true);
    expect(press(68.5, {})).toBe(false);
  });

  it("leave typed bounds beyond the slider alone while a drag only pushes against its end", () => {
    const panel = renderPanel();
    const { low, high } = spanThumbs(panel);
    const readout = panel.find('[data-key="size"] output.control-value', HTMLElement);

    // both bounds lie beyond the 100 end, so both thumbs sit there
    panel.controls.load("burst", { size: [150, 200] });
    pointer(high, "pointerdown", 106);
    pointer(high, "pointermove", 110);
    pointer(high, "pointermove", 126);

    expect(panel.state["size"]).toEqual([150, 200]);
    expect(readout.textContent).toBe("150 – 200 px");

    pointer(high, "pointerup", 126);
    panel.controls.load("burst", { size: [-50, -20] });
    pointer(low, "pointerdown", 6);
    pointer(low, "pointermove", 2);
    pointer(low, "pointermove", -14);

    expect(panel.state["size"]).toEqual([-50, -20]);

    pointer(low, "pointerup", -14);
    // a drag back into the slider still moves the picked thumb
    panel.controls.load("burst", { size: [150, 200] });
    pointer(high, "pointerdown", 106);
    pointer(high, "pointermove", 66);

    expect(panel.state["size"]).toEqual([60, 200]);
  });
});

describe("own style groups", () => {
  /**
   * Render the Real Control Table with Per-Card Overrides.
   *
   * @returns Controls, Their State, the Root and the Changed Keys
   */
  function renderReal(): {
    controls: ControlsHandle;
    state: ControlState;
    root: HTMLElement;
    changes: string[];
  } {
    const modeRoot = document.createElement("div");
    const root = document.createElement("div");
    const state: ControlState = {};
    const changes: string[] = [];
    modeRoot.append(root);
    document.body.append(modeRoot);
    const controls = renderControls(
      root,
      CONTROL_SECTIONS,
      state,
      (key) => {
        changes.push(key);
      },
      { mode: "advanced", modeRoot, overrides: createOverrideSource(CONTROL_SECTIONS, state) },
    );

    return { controls, state, root, changes };
  }

  /**
   * Find an Element of a Card's Own Style Area.
   *
   * @param root - Controls Root
   * @param prefix - Card Prefix
   * @param selector - Selector inside the Area
   * @param type - Expected Element Class
   * @returns Element
   */
  function inArea<T extends Element>(
    root: HTMLElement,
    prefix: string,
    selector: string,
    type: new () => T,
  ): T {
    const element = root.querySelector(`[data-key="${prefix}.styles"] ${selector}`);

    if (!(element instanceof type)) {
      throw new Error(`no ${selector} on ${prefix}`);
    }

    return element;
  }

  it("adds a picked group with the inherited values, and removes it again", () => {
    const { controls, state, root, changes } = renderReal();
    controls.setValue("star.enabled", true);
    const picker = inArea(root, "star", ".override-picker", HTMLSelectElement);
    const add = inArea(root, "star", ".override-add", HTMLButtonElement);

    expect(add.disabled).toBe(true);
    picker.value = "trail";
    picker.dispatchEvent(new Event("change"));
    expect(add.disabled).toBe(false);
    add.click();

    expect(state["star.styles"]).toEqual(["trail"]);
    expect(state["star.trail"]).toBe(false);
    expect(state["star.trailLength"]).toBe(state["trailLength"]);
    expect(controls.capture("burst")).toHaveProperty("star.trailLength");
    expect(root.querySelector('[data-key="star.styles"] [data-style="trail"]')).not.toBeNull();
    // a group in the list is no longer offered
    expect([...picker.options].map((option) => option.value)).not.toContain("trail");
    expect(changes.at(-1)).toBe("star.styles");

    inArea(root, "star", '[data-style="trail"] .override-remove', HTMLButtonElement).click();

    expect(state["star.styles"]).toEqual([]);
    expect(state).not.toHaveProperty("star.trail");
    expect(controls.capture("burst")).not.toHaveProperty("star.trailLength");
    expect(root.querySelector('[data-key="star.styles"] [data-style="trail"]')).toBeNull();
  });

  it("rebuilds the groups a loaded burst lists, and reset removes them", () => {
    const { controls, state, root } = renderReal();
    controls.load(
      "burst",
      normalizeBurst({ "heart.enabled": true, "heart.styles": ["shine"], "heart.shine": 0.4 }),
    );

    expect(state["heart.shine"]).toBe(0.4);
    expect(root.querySelector('[data-key="heart.shine"]')).not.toBeNull();
    expect(controls.capture("burst")).toEqual(
      normalizeBurst({ "heart.enabled": true, "heart.styles": ["shine"], "heart.shine": 0.4 }),
    );

    controls.reset();

    expect(state["heart.styles"]).toEqual([]);
    expect(state).not.toHaveProperty("heart.shine");
    expect(root.querySelector('[data-key="heart.shine"]')).toBeNull();
  });
});
