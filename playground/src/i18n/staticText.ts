import { el } from "../ui/dom";
import { getLocale, LOCALES, switchLocale } from "./Locale";
import { isMessageKey, t } from "./messages";
import type { MessageKey } from "./messages";

/**
 * Attributes that Carry Message Keys, and What They Fill.
 * `data-i18n-html` is only used for static strings written in `messages.ts` (never user input).
 */
const TARGETS: readonly (readonly [
  attribute: string,
  fill: (element: Element, text: string) => void,
])[] = [
  [
    "data-i18n",
    (element, text) => {
      element.textContent = text;
    },
  ],
  [
    "data-i18n-html",
    (element, text) => {
      element.innerHTML = text;
    },
  ],
  [
    "data-i18n-title",
    (element, text) => {
      element.setAttribute("title", text);
    },
  ],
  [
    "data-i18n-empty",
    (element, text) => {
      element.setAttribute("data-empty", text);
    },
  ],
  [
    "data-i18n-aria-label",
    (element, text) => {
      element.setAttribute("aria-label", text);
    },
  ],
];

/**
 * Fill Every `data-i18n*` Attribute Below a Root and Set the Document Language.
 *
 * @param root - Root to Translate
 * @param titleKey - Message Key of the Page Title
 */
export function applyStaticText(root: ParentNode, titleKey: MessageKey): void {
  document.documentElement.lang = getLocale();
  document.title = t(titleKey);

  for (const [attribute, fill] of TARGETS) {
    for (const element of root.querySelectorAll(`[${attribute}]`)) {
      const key = element.getAttribute(attribute) ?? "";

      if (isMessageKey(key)) {
        fill(element, t(key));
      } else if (import.meta.env.DEV) {
        console.warn(`playground: unknown message key "${key}"`);
      }
    }
  }
}

/**
 * Render EN / TR Switcher into a Container.
 *
 * @param container - Switcher Container
 */
export function mountLanguageSwitch(container: HTMLElement): void {
  const active = getLocale();
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", t("lang.label"));

  for (const locale of LOCALES) {
    const button = el("button", "lang-option", locale.toUpperCase());
    button.type = "button";
    button.lang = locale;
    button.setAttribute("aria-pressed", String(locale === active));
    button.addEventListener("click", () => {
      if (locale !== active) {
        switchLocale(locale);
      }
    });
    container.append(button);
  }
}
