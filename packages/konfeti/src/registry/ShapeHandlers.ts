import { paperShape } from "../shapes/handlers/paperShape";
import type { AnyShapeHandler } from "../types/shapes/ShapeHandler";

/**
 * Static Shape Handler Registry.
 * Paper is always present; `konfeti` registers every built-in on import, `konfeti/lite` only what you pass
 * to `registerShapes()`. Custom shapes from `defineShape()` land here too.
 */
export class ShapeHandlers {
  /**
   * Reserved Built-in Names (custom shapes cannot take them, even when not registered).
   */
  private static readonly RESERVED = new Set([
    "paper",
    "star",
    "triangle",
    "polygon",
    "heart",
    "ribbon",
    "path",
    "emoji",
    "text",
    "image",
    "spritesheet",
  ]);

  /**
   * Registered Handlers by Type.
   */
  private static readonly handlers = new Map<string, AnyShapeHandler>([
    [paperShape.type, paperShape],
  ]);

  /**
   * Register Built-in Handlers.
   *
   * @param handlers - Built-in Shape Handlers
   */
  public static register(...handlers: readonly AnyShapeHandler[]): void {
    for (const handler of handlers) {
      ShapeHandlers.handlers.set(handler.type, handler);
    }
  }

  /**
   * Register Custom Handler.
   *
   * @param handler - Custom Shape Handler
   * @throws TypeError for reserved (built-in) or empty names
   */
  public static registerCustom(handler: AnyShapeHandler): void {
    if (handler.type === "" || ShapeHandlers.RESERVED.has(handler.type)) {
      throw new TypeError(
        `konfeti: "${handler.type}" is a built-in shape name and cannot be redefined`,
      );
    }

    ShapeHandlers.handlers.set(handler.type, handler);
  }

  /**
   * Return Handler for Type.
   *
   * @param type - Shape Type
   * @returns Handler or Undefined
   */
  public static get(type: string): AnyShapeHandler | undefined {
    return ShapeHandlers.handlers.get(type);
  }

  /**
   * Check Reserved Built-in Name.
   *
   * @param type - Shape Type
   * @returns Reserved Flag
   */
  public static isReserved(type: string): boolean {
    return ShapeHandlers.RESERVED.has(type);
  }

  /**
   * Remove Handler (tests and hot reload; paper cannot be removed).
   *
   * @param type - Shape Type
   */
  public static remove(type: string): void {
    if (type !== paperShape.type) {
      ShapeHandlers.handlers.delete(type);
    }
  }
}
