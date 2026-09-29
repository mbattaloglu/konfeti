import type { presets } from "konfeti";

import { PRESETS_TR } from "../i18n/controlsTr";
import { getLocale } from "../i18n/Locale";
import { el } from "./dom";

/**
 * Built-In Preset Name.
 */
export type PresetName = Extract<keyof typeof presets, string>;

/**
 * Preset Gallery Card Definition.
 */
type PresetCard = {
  /**
   * Preset Key on `presets`.
   */
  readonly name: PresetName;
  /**
   * Display Name.
   */
  readonly label: string;
  /**
   * Decorative Glyph.
   */
  readonly icon: string;
};

/**
 * Preset Gallery (one card per built-in preset).
 */
const PRESET_CARDS: readonly PresetCard[] = [
  { name: "basic", label: "Basic", icon: "🎉" },
  { name: "realistic", label: "Realistic", icon: "🎊" },
  { name: "cannon", label: "Cannon", icon: "💥" },
  { name: "fireworks", label: "Fireworks", icon: "🎆" },
  { name: "schoolPride", label: "School Pride", icon: "🏫" },
  { name: "snow", label: "Snow", icon: "❄️" },
  { name: "stars", label: "Stars", icon: "⭐" },
  { name: "emojiRain", label: "Emoji Rain", icon: "🌧️" },
  { name: "heartBurst", label: "Heart Burst", icon: "💖" },
  { name: "sideShots", label: "Side Shots", icon: "↔️" },
];

/**
 * Render Preset Gallery Buttons.
 *
 * @param root - Container Element
 * @param onPick - Called with the Picked Preset
 */
export function renderPresets(root: HTMLElement, onPick: (name: PresetName) => void): void {
  for (const card of PRESET_CARDS) {
    const button = el("button", "preset");
    button.type = "button";
    button.title = `presets.${card.name}()`;
    button.append(
      el("span", "preset-icon", card.icon),
      el(
        "span",
        "preset-label",
        (getLocale() === "tr" ? PRESETS_TR[card.name] : undefined) ?? card.label,
      ),
      el("code", "preset-code", `${card.name}()`),
    );
    button.addEventListener("click", () => {
      onPick(card.name);
    });
    root.append(button);
  }
}
