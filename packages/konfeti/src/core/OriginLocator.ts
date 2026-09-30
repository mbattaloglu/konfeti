import type { OriginBox } from "../types/resolved/OriginBox";
import type { PlacedOrigin } from "../types/resolved/PlacedOrigin";
import type { RenderSurface } from "./RenderSurface";

/**
 * Static Origin-to-Canvas Mapper.
 * Shared by emission (where particles start) and the attractor (where they are pulled to).
 */
export class OriginLocator {
  /**
   * Map a Placed Origin into Canvas Pixel Ranges.
   *
   * @param origin - Placed Origin
   * @param surface - Drawing Surface
   * @returns Horizontal and Vertical Pixel Ranges
   */
  public static box(origin: PlacedOrigin, surface: RenderSurface): OriginBox {
    switch (origin.kind) {
      case "element": {
        const center = surface.getElementCenter(origin.element);
        return { x: [center.x, center.x], y: [center.y, center.y] };
      }
      case "client": {
        const point = surface.clientToLocal(origin.clientX, origin.clientY);
        return { x: [point.x, point.x], y: [point.y, point.y] };
      }
      case "point": {
        const width = surface.getWidth();
        const height = surface.getHeight();
        return {
          x: [origin.x[0] * width, origin.x[1] * width],
          y: [origin.y[0] * height, origin.y[1] * height],
        };
      }
    }
  }
}
