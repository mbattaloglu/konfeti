import type { FrameRect } from "../types/FrameRect";
import type { SpriteAtlas } from "../types/SpriteAtlas";

/**
 * Read the Rectangle of One Atlas Frame.
 *
 * @param name - Frame Name (for error messages)
 * @param entry - Atlas Frame (untrusted JSON)
 * @returns Frame Rectangle
 * @throws TypeError for a malformed or rotated frame
 */
function toRect(name: string, entry: unknown): FrameRect {
  const frame = typeof entry === "object" && entry !== null ? entry : null;
  const box = frame !== null && "frame" in frame ? frame.frame : null;
  const read = (key: "x" | "y" | "w" | "h"): number => {
    const value: unknown = typeof box === "object" && box !== null ? Reflect.get(box, key) : null;

    return typeof value === "number" ? value : Number.NaN;
  };
  const [x, y, width, height] = [read("x"), read("y"), read("w"), read("h")];

  if (frame !== null && "rotated" in frame && frame.rotated === true) {
    throw new TypeError(
      `konfeti: atlas frame "${name}" is rotated; export the sheet without frame rotation`,
    );
  }

  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new TypeError(
      `konfeti: atlas frame "${name}" needs a frame { x, y, w, h } with a positive size`,
    );
  }

  return { x, y, width, height };
}

/**
 * Turn a Sprite Atlas JSON into Spritesheet Frames.
 * Reads the frame list that TexturePacker, Aseprite, Free Texture Packer or Phaser export next to a packed sheet, in
 * the order the atlas lists them, and returns the rectangles a `spritesheet` shape's `frames` takes. A name prefix
 * picks one animation out of an atlas that holds several.
 *
 * @param atlas - Atlas JSON ("JSON Hash" or "JSON Array" layout)
 * @param prefix - Only Frames Whose Name Starts with This (default: every frame)
 * @returns Frame Rectangles in Atlas Order
 * @throws TypeError for a malformed atlas, a rotated frame, or no frame matching the prefix
 * @example
 * ```ts
 * import atlas from "./coins.json";
 *
 * Konfeti.fire({
 *   shapes: [{ type: "spritesheet", src: "/coins.png", frames: framesFromAtlas(atlas, "coin_spin") }],
 * });
 * ```
 * @remarks Trimmed frames of different sizes are each stretched to the particle size; export animations without
 * trimming (or with "keep size") so they do not wobble.
 */
export function framesFromAtlas(atlas: SpriteAtlas, prefix = ""): FrameRect[] {
  // atlas json is a user boundary: its shape is checked here, not trusted from the type
  const frames: unknown = atlas.frames;
  let entries: (readonly [name: string, entry: unknown])[];

  if (Array.isArray(frames)) {
    entries = frames.map((entry: unknown, index) => {
      const name =
        typeof entry === "object" && entry !== null && "filename" in entry
          ? String(entry.filename)
          : String(index);

      return [name, entry] as const;
    });
  } else if (typeof frames === "object" && frames !== null) {
    entries = Object.entries(frames);
  } else {
    throw new TypeError('konfeti: an atlas needs a "frames" object or list');
  }

  const rects = entries
    .filter(([name]) => name.startsWith(prefix))
    .map(([name, entry]) => toRect(name, entry));

  if (rects.length === 0) {
    throw new TypeError(
      prefix === ""
        ? "konfeti: the atlas has no frames"
        : `konfeti: the atlas has no frames named "${prefix}…"`,
    );
  }

  return rects;
}
