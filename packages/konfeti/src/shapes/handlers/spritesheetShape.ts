import { BITMAP_DEFAULTS } from "../../config/ShapeDefaults";
import { ResolveUtils } from "../../core/resolve/ResolveUtils";
import type { ResolvedFrames } from "../../types/resolved/ResolvedShape";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import type { SpriteSheetShapeOptions } from "../../types/shapes/SpriteSheetShapeOptions";
import type { SpriteFrames } from "../../types/SpriteFrames";
import { ImageSource } from "../../utils/ImageSource";
import { RangeUtils } from "../../utils/RangeUtils";
import { SpriteSpawner } from "../spawn/SpriteSpawner";

/**
 * Resolve Spritesheet Frame Layout.
 *
 * @param frames - Public Frame Layout
 * @param name - Option Path for Error Messages
 * @returns Resolved Frames
 */
function resolveFrames(frames: SpriteFrames, name: string): ResolvedFrames {
  if (Array.isArray(frames)) {
    if (frames.length === 0) {
      throw new TypeError(`konfeti: "${name}.frames" must contain at least one frame`);
    }

    return { kind: "rects", rects: frames };
  }

  const grid = frames as Exclude<SpriteFrames, readonly unknown[]>;
  const cols = Math.floor(grid.cols);
  const rows = Math.floor(grid.rows);
  ResolveUtils.assertPositive(cols, `${name}.frames.cols`);
  ResolveUtils.assertPositive(rows, `${name}.frames.rows`);
  const count = Math.min(Math.floor(grid.count ?? cols * rows), cols * rows);
  ResolveUtils.assertPositive(count, `${name}.frames.count`);

  return { kind: "grid", cols, rows, count };
}

/**
 * Animated Spritesheet Shape Handler.
 */
export const spritesheetShape: ShapeHandler<SpriteSheetShapeOptions> = {
  type: "spritesheet",
  styleDefaults: { flip: false, wobble: false, rotation: 0, rotationSpeed: 0 },
  resolve: (entry, { style, name }) => {
    const fps = RangeUtils.toTuple(entry.fps ?? BITMAP_DEFAULTS.spriteFps, `${name}.fps`);

    return SpriteSpawner.create({
      kind: "sprite",
      style,
      size: RangeUtils.toTuple(entry.size ?? BITMAP_DEFAULTS.spriteSize, `${name}.size`),
      source: ImageSource.from(entry.src),
      frames: resolveFrames(entry.frames, name),
      fps: [Math.max(0, fps[0]), Math.max(0, fps[1])],
      loop: entry.loop ?? BITMAP_DEFAULTS.spriteLoop,
      randomStartFrame: entry.randomStartFrame ?? BITMAP_DEFAULTS.spriteRandomStartFrame,
    });
  },
};
