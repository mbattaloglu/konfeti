import type { Control, ControlCard, ControlSection } from "../controlTypes";
import { CARDS_TR, CONTROLS_TR, SECTIONS_TR, SHAPE_CONTROLS_TR } from "./controlsTr";
import type { ControlText } from "./controlsTr";
import { getLocale } from "./Locale";

/**
 * Find Turkish Text for a Control (own key first, then the shared shape-card text).
 *
 * @param key - Control State Key
 * @returns Control Text
 */
function controlText(key: string): ControlText {
  const own = CONTROLS_TR[key];

  if (own !== undefined) {
    return own;
  }

  const shared = SHAPE_CONTROLS_TR[key.slice(key.indexOf(".") + 1)];

  if (shared === undefined && import.meta.env.DEV) {
    console.warn(`playground: no Turkish text for control "${key}"`);
  }

  return shared ?? {};
}

/**
 * Translate One Control.
 *
 * @param control - Control Definition
 * @returns Translated Control
 */
function localizeControl(control: Control): Control {
  const text = controlText(control.key);
  const translated = {
    ...control,
    ...(text.label === undefined ? {} : { label: text.label }),
    ...(text.hint === undefined || control.hint === undefined ? {} : { hint: text.hint }),
  };

  if (translated.kind === "palette" && text.empty !== undefined) {
    return { ...translated, emptyLabel: text.empty };
  }

  return translated.kind === "range" && text.zero !== undefined
    ? { ...translated, zeroLabel: text.zero }
    : translated;
}

/**
 * Translate One Shape Card.
 *
 * @param card - Card Definition
 * @returns Translated Card
 */
function localizeCard(card: ControlCard): ControlCard {
  return {
    ...card,
    title: CARDS_TR[card.enableKey] ?? card.title,
    controls: card.controls.map(localizeControl),
  };
}

/**
 * Translate the Control Table into the Active Language (English is the source, returned as is).
 *
 * @param sections - English Control Sections
 * @returns Sections in the Active Language
 */
export function localizeSections(sections: readonly ControlSection[]): readonly ControlSection[] {
  if (getLocale() === "en") {
    return sections;
  }

  return sections.map((section) => {
    const text = SECTIONS_TR[section.id];
    const localized: ControlSection = {
      ...section,
      title: text?.title ?? section.title,
      controls: section.controls.map(localizeControl),
      ...(section.cards === undefined ? {} : { cards: section.cards.map(localizeCard) }),
    };

    return text?.description === undefined
      ? localized
      : { ...localized, description: text.description };
  });
}
