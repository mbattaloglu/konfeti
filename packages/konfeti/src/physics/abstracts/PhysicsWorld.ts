import type { RenderSurface } from "../../core/RenderSurface";

/**
 * Simulation Bounds in CSS Pixels.
 */
export type PhysicsWorld = {
  /**
   * Canvas Width.
   */
  width: number;
  /**
   * Canvas Height.
   */
  height: number;
  /**
   * Drawing Surface, for Modules that Locate Targets (null until the engine sets it).
   */
  surface: RenderSurface | null;
};
