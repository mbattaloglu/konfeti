import type {
  ChipsControl,
  Control,
  ControlCard,
  ControlSection,
  ControlValue,
  ToggleControl,
  ValueDomain,
} from "../controlTypes";
import { overrideGroupsFor, stylesKey } from "./overrideGroups";

/**
 * One Static Control with Everything the Pure Editor Model Needs to Know about It.
 */
export type ControlEntry = {
  /**
   * State Key.
   */
  readonly key: string;
  /**
   * Control Definition (a card switch appears as a toggle control).
   */
  readonly control: Control;
  /**
   * Initial Value (`""` for file controls).
   */
  readonly initial: ControlValue;
  /**
   * Id of the Section the Control Belongs To.
   */
  readonly section: string;
  /**
   * Prefix of the Card the Control Belongs To (`"star"`), or Null outside Cards.
   */
  readonly card: string | null;
  /**
   * Card Switch Flag (`<prefix>.enabled`).
   */
  readonly isCardSwitch: boolean;
  /**
   * Own Style List Flag (`<prefix>.styles`): the groups the card overrides, each adding its own keys.
   */
  readonly isStyleList: boolean;
  /**
   * Advanced-Only Flag (its own flag or its section's).
   */
  readonly advanced: boolean;
  /**
   * Global Flag: shared by all bursts (the hooks section).
   */
  readonly global: boolean;
  /**
   * Local-Only Flag: an object URL of a picked file, which only works in this tab and never enters a link.
   */
  readonly local: boolean;
  /**
   * Derived Flag: computed from other values and never emitted (the color theme).
   */
  readonly derived: boolean;
  /**
   * Accepted Values of a Range or Span Control.
   */
  readonly domain?: ValueDomain;
  /**
   * Values a Select or Chips Control Accepts (select: basic and advanced options, never derived ones).
   */
  readonly options: readonly string[];
};

/**
 * Card of the Shapes Section.
 */
export type IndexedCard = {
  /**
   * State Key Prefix (`"sprite"`).
   */
  readonly prefix: string;
  /**
   * State Key of the Card Switch.
   */
  readonly enableKey: string;
};

/**
 * Lookup of Every Static Control.
 */
export type ControlIndex = {
  /**
   * Entries by State Key.
   */
  readonly entries: ReadonlyMap<string, ControlEntry>;
  /**
   * Per-Burst Keys in Table Order.
   */
  readonly burstKeys: readonly string[];
  /**
   * Global Keys in Table Order.
   */
  readonly globalKeys: readonly string[];
  /**
   * Every Card in Table Order.
   */
  readonly cards: readonly IndexedCard[];
};

/**
 * Return the State Key Prefix of a Card.
 *
 * @param card - Card Definition
 * @returns Prefix (the part of the enable key before the first dot)
 */
export function cardPrefix(card: ControlCard): string {
  const dot = card.enableKey.indexOf(".");

  return dot < 0 ? card.enableKey : card.enableKey.slice(0, dot);
}

/**
 * Return the Initial Value of a Control.
 *
 * @param control - Control Definition
 * @returns Initial Value (`""` for a file control, which starts with no file)
 */
export function initialOf(control: Control): ControlValue {
  return control.kind === "file" ? "" : control.initial;
}

/**
 * Return the Values a Select or Chips Control Accepts.
 *
 * @param control - Control Definition
 * @returns Accepted Option Values (empty for other kinds)
 */
function acceptedOptions(control: Control): readonly string[] {
  if (control.kind === "chips") {
    return control.options;
  }

  return control.kind === "select" ? [...control.options, ...(control.advancedOptions ?? [])] : [];
}

/**
 * Describe a Card Switch as a Toggle Control.
 *
 * @param card - Card Definition
 * @returns Toggle Control for the Enable Key
 */
function cardSwitch(card: ControlCard): ToggleControl {
  return {
    kind: "toggle",
    key: card.enableKey,
    label: card.title,
    param: card.param,
    initial: card.initialEnabled,
  };
}

/**
 * Describe a Card's List of Own Style Groups as a Chips Control (one chip per group it can override).
 *
 * @param card - Card Definition
 * @param prefix - Card Prefix
 * @returns Chips Control for `<prefix>.styles` (rendered as the card's own-style area, not as chips)
 */
function styleList(card: ControlCard, prefix: string): ChipsControl {
  return {
    kind: "chips",
    key: stylesKey(prefix),
    label: card.title,
    param: card.param,
    options: overrideGroupsFor(prefix).map((group) => group.key),
    initial: [],
    advanced: true,
  };
}

/**
 * Index Every Static Control of the Control Table.
 * Built once; localized sections index the same keys, initials, options and domains as the English ones.
 *
 * @param sections - Control Sections
 * @returns Control Index
 */
export function createControlIndex(sections: readonly ControlSection[]): ControlIndex {
  const entries = new Map<string, ControlEntry>();
  const burstKeys: string[] = [];
  const globalKeys: string[] = [];
  const cards: IndexedCard[] = [];

  const add = (
    section: ControlSection,
    control: Control,
    card: string | null,
    isCardSwitch: boolean,
    isStyleList = false,
  ): void => {
    const domain = control.kind === "range" || control.kind === "span" ? control.domain : undefined;
    const global = section.global === true;
    entries.set(control.key, {
      key: control.key,
      control,
      initial: initialOf(control),
      section: section.id,
      card,
      isCardSwitch,
      isStyleList,
      advanced: control.advanced === true || section.advanced === true,
      global,
      local: control.kind === "file",
      derived: control.kind === "select" && control.derivedOptions !== undefined,
      options: acceptedOptions(control),
      ...(domain === undefined ? {} : { domain }),
    });
    (global ? globalKeys : burstKeys).push(control.key);
  };

  for (const section of sections) {
    for (const control of section.controls) {
      add(section, control, null, false);
    }

    for (const card of section.cards ?? []) {
      const prefix = cardPrefix(card);
      cards.push({ prefix, enableKey: card.enableKey });
      add(section, cardSwitch(card), prefix, true);

      for (const control of card.controls) {
        add(section, control, prefix, false);
      }

      add(section, styleList(card, prefix), prefix, false, true);
    }
  }

  return { entries, burstKeys, globalKeys, cards };
}

/**
 * Return the Card a State Key Belongs To.
 * Static keys come from the index; other keys (per-card override keys) name their card in the first segment.
 *
 * @param index - Control Index
 * @param key - State Key
 * @returns Card, or Null for Keys Outside Cards
 */
export function cardOf(index: ControlIndex, key: string): IndexedCard | null {
  const entry = index.entries.get(key);
  const prefix = entry === undefined ? key.slice(0, Math.max(0, key.indexOf("."))) : entry.card;

  return index.cards.find((card) => card.prefix === prefix) ?? null;
}
