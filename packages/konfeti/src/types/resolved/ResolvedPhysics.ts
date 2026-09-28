import type { PhysicsDefinition } from "../PhysicsDefinition";
import type { RangeTuple } from "../Range";

/**
 * Fully Resolved Physics Settings.
 */
export type ResolvedPhysics = {
  /**
   * Gravity Range.
   */
  readonly gravity: RangeTuple;
  /**
   * Drag Range.
   */
  readonly drag: RangeTuple;
  /**
   * Wind Range.
   */
  readonly wind: RangeTuple;
  /**
   * Speed Limit (`Infinity` disables it).
   */
  readonly terminalVelocity: number;
  /**
   * Swirl Settings (`null` disables swirl).
   */
  readonly swirl: { readonly strength: RangeTuple; readonly frequency: RangeTuple } | null;
  /**
   * Floor Settings (`null` disables the floor).
   */
  readonly floor: { readonly y: number; readonly bounce: number; readonly friction: number } | null;

  /**
   * Enabled Custom Modules with Merged Options.
   */
  readonly custom: readonly {
    readonly definition: PhysicsDefinition<object>;
    readonly options: object;
  }[];
};
