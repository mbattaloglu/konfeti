import type { FrameRect } from "./FrameRect";

/**
 * Spritesheet Frame Layout.
 * - Grid: frames of equal size, read left → right, top → bottom. `count` limits the frames used when the last
 *   row is not full.
 * - Rect list: explicit frame rectangles (e.g. from an atlas JSON), played in order.
 *
 * @example
 * ```ts
 * frames: { cols: 8, rows: 1 }
 * frames: { cols: 4, rows: 4, count: 14 }
 * frames: [{ x: 0, y: 0, width: 32, height: 32 }, { x: 32, y: 0, width: 32, height: 32 }]
 * ```
 */
export type SpriteFrames =
  | {
      /**
       * Column Count.
       */
      readonly cols: number;
      /**
       * Row Count.
       */
      readonly rows: number;
      /**
       * Used Frame Count.
       *
       * @defaultValue `cols × rows`
       */
      readonly count?: number;
    }
  | readonly FrameRect[];
