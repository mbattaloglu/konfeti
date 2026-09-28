import type { AnyShapeHandler } from "../../types/shapes/ShapeHandler";
import { emojiShape } from "./emojiShape";
import { heartShape } from "./heartShape";
import { imageShape } from "./imageShape";
import { pathShape } from "./pathShape";
import { polygonShape } from "./polygonShape";
import { ribbonShape } from "./ribbonShape";
import { spritesheetShape } from "./spritesheetShape";
import { starShape } from "./starShape";
import { textShape } from "./textShape";
import { triangleShape } from "./triangleShape";

/**
 * Every Built-in Shape Handler except Paper (which is always registered).
 * Imported by the full `konfeti` entry; `konfeti/lite` leaves it out so bundlers can drop unused shapes.
 */
export const BUILTIN_SHAPES: readonly AnyShapeHandler[] = [
  starShape,
  triangleShape,
  polygonShape,
  heartShape,
  ribbonShape,
  pathShape,
  emojiShape,
  textShape,
  imageShape,
  spritesheetShape,
];
