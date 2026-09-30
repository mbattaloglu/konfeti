/**
 * SVG Namespace.
 */
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Line Icon Paths per Section Id (24×24 grid, stroked with `currentColor`).
 * Drawn as SVG so they never depend on font glyph support.
 */
const SECTION_ICON_PATHS: Readonly<Record<string, readonly string[]>> = {
  burst: [
    "M12 3v4M12 17v4M3 12h4M17 12h4",
    "M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8",
  ],
  emission: ["M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z", "M12 9v4l2.5 1.5", "M9 2h6"],
  // a letter "A" traced by particles
  formation: [
    "M5 20h.01M7.3 14.5h.01M9.6 9h.01M12 3.5h.01M14.4 9h.01M16.7 14.5h.01M19 20h.01",
    "M10 14.5h.01M14 14.5h.01",
  ],
  geometry: ["M3 3h10v10H3Z", "M21 15a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"],
  colors: ["M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z", "M9 15a3 3 0 0 0 3 3"],
  motion: ["M21 12a9 9 0 1 1-2.6-6.4L21 8", "M21 3v5h-5"],
  life: ["M6 2h12M6 22h12", "M7 2c0 5 5 6 5 10s-5 5-5 10M17 2c0 5-5 6-5 10s5 5 5 10"],
  shapes: ["M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"],
  physics: ["M12 3v13", "M6.5 10.5 12 16l5.5-5.5", "M5 21h14"],
  hooks: ["M13 2 4 14h7l-1 8 9-12h-7l1-8Z"],
};

/**
 * Create Section Icon.
 *
 * @param id - Section Id
 * @param fallback - Text Glyph Used when No SVG Icon Exists
 * @returns SVG Icon or Text Node
 */
export function createSectionIcon(id: string, fallback: string): SVGSVGElement | Text {
  const paths = SECTION_ICON_PATHS[id];

  if (paths === undefined) {
    return document.createTextNode(fallback);
  }

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }

  return svg;
}
