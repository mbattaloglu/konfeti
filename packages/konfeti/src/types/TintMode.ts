/**
 * How a Tint Recolors an Image.
 * - `"multiply"` — multiplies the color into the image and keeps its shading: white turns fully into the color, black
 *   stays black, greys become darker shades of it.
 * - `"fill"` — a flat silhouette: every visible pixel takes the color, keeping its transparency.
 */
export type TintMode = "multiply" | "fill";
