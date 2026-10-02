import { isEditorMode, readEditorMode, writeEditorMode } from "../editor/editorMode";
import type { EditorMode } from "../editor/editorMode";
import { t } from "../i18n/messages";

/**
 * Hidden Setting Count That Takes the Singular Message.
 */
const SINGLE_HIDDEN_COUNT = 1;

/**
 * Called after the User Picked Another Editor Mode.
 */
export type ModeListener = (mode: EditorMode) => void;

/**
 * Imperative Access to the Basic / Advanced Switch.
 */
export type ModeSwitchHandle = {
  /**
   * Return the Current Editor Mode.
   */
  readonly mode: () => EditorMode;
  /**
   * Set the Listener Called after the User Picks Another Mode.
   */
  readonly onChange: (listener: ModeListener) => void;
  /**
   * Show How Many Active Settings Basic Mode Hides (the badge on the Advanced button, shown only in Basic).
   */
  readonly setHiddenCount: (count: number) => void;
};

/**
 * Wire the Basic / Advanced Switch (`#editor-mode`) and Its Badge.
 * The mode starts at the remembered one and is remembered again on every pick.
 *
 * @param root - Switch Group Holding the `.mode-option` Buttons
 * @param badge - Badge Element inside the Advanced Button
 * @returns Mode Switch Handle
 */
export function renderModeSwitch(root: HTMLElement, badge: HTMLElement): ModeSwitchHandle {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>(".mode-option")];
  const advancedButton = buttons.find((button) => button.dataset["mode"] === "advanced");
  let mode = readEditorMode();
  let hidden = 0;
  let listener: ModeListener = () => undefined;

  const show = (): void => {
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset["mode"] === mode));
    }

    // Advanced shows every setting, so the count only means something in Basic
    const visible = mode === "basic" && hidden > 0;
    badge.hidden = !visible;
    badge.textContent = visible ? String(hidden) : "";

    if (visible) {
      const message = hidden === SINGLE_HIDDEN_COUNT ? "mode.hiddenOne" : "mode.hidden";
      advancedButton?.setAttribute("title", t(message, { count: hidden }));
    } else {
      advancedButton?.removeAttribute("title");
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const picked = button.dataset["mode"];

      if (!isEditorMode(picked) || picked === mode) {
        return;
      }

      mode = picked;
      writeEditorMode(mode);
      show();
      listener(mode);
    });
  }

  show();

  return {
    mode: () => mode,
    onChange: (next) => {
      listener = next;
    },
    setHiddenCount: (count) => {
      hidden = count;
      show();
    },
  };
}
