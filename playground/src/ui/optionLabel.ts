import { OPTION_LABELS_TR } from "../i18n/controlsTr";
import { getLocale } from "../i18n/Locale";

/**
 * Hand-Picked Display Names for Option Values.
 * Values not listed here are converted automatically (`easeInQuad` → `Ease In Quad`).
 */
const OPTION_LABELS: Readonly<Record<string, string>> = {
  rect: "Rectangle",
  "source-over": "Normal",
  lighter: "Additive",
  "color-dodge": "Color Dodge",
  x: "Horizontal Axis",
  y: "Vertical Axis",
  both: "Both Axes",
  "400": "Regular",
  "700": "Bold",
  "900": "Black",
  "demo canvas": "Demo Canvas",
  "demo url": "Demo URL",
  "inline svg": "Inline SVG",
};

/**
 * Word Boundary Pattern (camelCase humps, dashes, underscores, spaces).
 */
const WORD_BOUNDARY = /(?<=[a-z0-9])(?=[A-Z])|[-_\s]+/;

/**
 * Return Human-Readable Title Case Label for an Option Value.
 *
 * @param value - Raw Option Value (as sent to the library)
 * @returns Display Label
 */
export function optionLabel(value: string): string {
  const known =
    (getLocale() === "tr" ? OPTION_LABELS_TR[value] : undefined) ?? OPTION_LABELS[value];

  if (known !== undefined) {
    return known;
  }

  return value
    .split(WORD_BOUNDARY)
    .filter((word) => word !== "")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
