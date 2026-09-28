import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";
import type { ShapeRegistry } from "./ShapeRegistry";

/**
 * Entry for a Shape Registered with `defineShape()`.
 * One union member per {@link ShapeRegistry} key; `never` while the registry is empty.
 */
export type CustomShapeOptions = {
  [K in keyof ShapeRegistry]: ShapeEntryBase &
    ShapeRegistry[K] & {
      /**
       * Shape Type.
       */
      readonly type: K;
      /**
       * Rendered Width.
       *
       * @defaultValue the shape definition's `defaultSize`
       */
      readonly size?: Range<Pixels>;
    };
}[keyof ShapeRegistry];
