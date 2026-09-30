import type { KonfetiPresetName } from "konfeti";

import { PRESETS_TR } from "../i18n/controlsTr";
import { getLocale } from "../i18n/Locale";
import { el } from "./dom";

/**
 * Preset Gallery Card Definition.
 */
type PresetCard = {
  /**
   * Member Name on `KonfetiPresets`.
   */
  readonly name: KonfetiPresetName;
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
  { name: "BASIC", label: "Basic", icon: "🎉" },
  { name: "REALISTIC", label: "Realistic", icon: "🎊" },
  { name: "CANNON", label: "Cannon", icon: "💥" },
  { name: "FIREWORKS", label: "Fireworks", icon: "🎆" },
  { name: "SCHOOL_PRIDE", label: "School Pride", icon: "🏫" },
  { name: "SNOW", label: "Snow", icon: "❄️" },
  { name: "STARS", label: "Stars", icon: "⭐" },
  { name: "EMOJI_RAIN", label: "Emoji Rain", icon: "🌧️" },
  { name: "HEART_BURST", label: "Heart Burst", icon: "💖" },
  { name: "SIDE_SHOTS", label: "Side Shots", icon: "↔️" },
  { name: "SHOOTING_STARS", label: "Shooting Stars", icon: "🌠" },
  { name: "MAGNET", label: "Magnet", icon: "🧲" },
  { name: "GOLDEN", label: "Golden", icon: "🏆" },
  { name: "CONGRATS", label: "Congrats", icon: "🔠" },
  { name: "LOGO_REVEAL", label: "Logo Reveal", icon: "🏅" },
];

/**
 * Render Preset Gallery Buttons.
 *
 * @param root - Container Element
 * @param onPick - Called with the Picked Preset
 */
export function renderPresets(root: HTMLElement, onPick: (name: KonfetiPresetName) => void): void {
  for (const card of PRESET_CARDS) {
    const button = el("button", "preset");
    button.type = "button";
    button.title = `KonfetiPresets.${card.name}`;
    button.append(
      el("span", "preset-icon", card.icon),
      el(
        "span",
        "preset-label",
        (getLocale() === "tr" ? PRESETS_TR[card.name] : undefined) ?? card.label,
      ),
      el("code", "preset-code", card.name),
    );
    button.addEventListener("click", () => {
      onPick(card.name);
    });
    root.append(button);
  }
}
