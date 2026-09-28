/**
 * Relative Luminance Threshold above which Dark Text Reads Better.
 */
const LIGHT_THRESHOLD = 0.6;

/**
 * Pick Readable Text Color for a Hex Background.
 *
 * @param hex - Background Color (`#rrggbb`)
 * @returns Dark or Light Text Color
 */
export function readableTextColor(hex: string): string {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);

  if (match === null) {
    return "#ffffff";
  }

  const [r, g, b] = [match[1], match[2], match[3]].map((part) => parseInt(part ?? "0", 16) / 255);
  // perceived brightness (Rec. 601 weights) is enough for picking a label color
  const luminance = 0.299 * (r ?? 0) + 0.587 * (g ?? 0) + 0.114 * (b ?? 0);

  return luminance > LIGHT_THRESHOLD ? "#15141c" : "#ffffff";
}
