import { afterEach, describe, expect, it } from "vitest";

import { MODE_STORAGE_KEY } from "../src/editor/editorMode";
import type { EditorMode } from "../src/editor/editorMode";
import { renderModeSwitch } from "../src/ui/renderModeSwitch";
import type { ModeSwitchHandle } from "../src/ui/renderModeSwitch";

/**
 * Rendered Basic / Advanced Switch.
 */
type ModeSwitch = {
  /**
   * Switch Handle.
   */
  readonly handle: ModeSwitchHandle;
  /**
   * Basic Button.
   */
  readonly basic: HTMLButtonElement;
  /**
   * Advanced Button.
   */
  readonly advanced: HTMLButtonElement;
  /**
   * Badge inside the Advanced Button.
   */
  readonly badge: HTMLElement;
  /**
   * Modes Passed to the Listener, in Order.
   */
  readonly picks: EditorMode[];
};

/**
 * Create a Switch Button.
 *
 * @param mode - Mode the Button Picks
 * @param pressed - Initially Pressed Flag
 * @returns Button
 */
function modeButton(mode: EditorMode, pressed: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mode-option";
  button.dataset["mode"] = mode;
  button.setAttribute("aria-pressed", String(pressed));
  button.textContent = mode;

  return button;
}

/**
 * Render the Switch Markup of index.html and Wire It.
 *
 * @returns Rendered Switch
 */
function renderSwitch(): ModeSwitch {
  const root = document.createElement("div");
  const basic = modeButton("basic", true);
  const advanced = modeButton("advanced", false);
  const badge = document.createElement("span");
  badge.className = "mode-badge";
  badge.hidden = true;
  advanced.append(badge);
  root.append(basic, advanced);
  document.body.append(root);
  const handle = renderModeSwitch(root, badge);
  const picks: EditorMode[] = [];
  handle.onChange((mode) => {
    picks.push(mode);
  });

  return { handle, basic, advanced, badge, picks };
}

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
});

describe("renderModeSwitch", () => {
  it("shows the hidden count only in Basic, with a title that reads it", () => {
    const { handle, advanced, badge } = renderSwitch();

    expect(handle.mode()).toBe("basic");
    expect(badge.hidden).toBe(true);

    handle.setHiddenCount(3);

    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe("3");
    expect(advanced.title).toBe("3 active settings are hidden in Basic");

    handle.setHiddenCount(1);

    expect(advanced.title).toBe("1 active setting is hidden in Basic");

    handle.setHiddenCount(0);

    expect(badge.hidden).toBe(true);
    expect(advanced.hasAttribute("title")).toBe(false);
  });

  it("switches and remembers the mode on a pick, and hides the badge in Advanced", () => {
    const { handle, basic, advanced, badge, picks } = renderSwitch();
    handle.setHiddenCount(2);

    advanced.click();

    expect(handle.mode()).toBe("advanced");
    expect(advanced.getAttribute("aria-pressed")).toBe("true");
    expect(basic.getAttribute("aria-pressed")).toBe("false");
    expect(badge.hidden).toBe(true);
    expect(advanced.hasAttribute("title")).toBe(false);
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe("advanced");

    // a pick of the current mode changes nothing
    advanced.click();

    expect(picks).toEqual(["advanced"]);

    basic.click();

    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe("2");
    expect(picks).toEqual(["advanced", "basic"]);
  });

  it("starts in the remembered mode", () => {
    localStorage.setItem(MODE_STORAGE_KEY, "advanced");
    const { handle, basic, advanced } = renderSwitch();

    expect(handle.mode()).toBe("advanced");
    expect(advanced.getAttribute("aria-pressed")).toBe("true");
    expect(basic.getAttribute("aria-pressed")).toBe("false");
  });
});
