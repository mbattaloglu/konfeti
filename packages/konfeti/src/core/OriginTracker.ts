import type { EmitterTarget } from "../types/EmitterTarget";
import type { PlacedOrigin } from "../types/resolved/PlacedOrigin";
import { OptionResolver } from "./resolve/OptionResolver";

/**
 * Moving Origin of a Continuous Emitter.
 * Holds what the emitter follows; the emitter reads the current place at every emission, so elements can
 * move and the pointer is tracked live.
 */
export class OriginTracker {
  /**
   * Current Place, or Null while There Is None (pointer not seen yet).
   */
  private current: PlacedOrigin | null = null;

  /**
   * Pointer Listeners Registered Flag.
   */
  private _isFollowingPointer = false;

  /**
   * Follow a New Target.
   *
   * @param target - Element, `"pointer"` or Normalized Point
   */
  public moveTo(target: EmitterTarget): void {
    if (target === "pointer") {
      // keep the last pointer position when already following it
      if (!this._isFollowingPointer) {
        this.current = null;
        this.registerPointerEvents();
      }
      return;
    }

    this.unregisterPointerEvents();
    this.current = OptionResolver.resolveOrigin(target);
  }

  /**
   * Hide the Origin (nothing is emitted until the next moveTo()).
   */
  public hide(): void {
    this.unregisterPointerEvents();
    this.current = null;
  }

  /**
   * Return Current Place.
   *
   * @returns Placed Origin, or Null when There Is None
   */
  public getOrigin(): PlacedOrigin | null {
    return this.current;
  }

  /**
   * Remove Listeners (called when the emitter finishes).
   */
  public detach(): void {
    this.unregisterPointerEvents();
  }

  /**
   * Start Tracking the Pointer.
   */
  private registerPointerEvents(): void {
    if (this._isFollowingPointer || typeof window === "undefined") {
      return;
    }

    this._isFollowingPointer = true;
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerdown", this.onPointer, { passive: true });
  }

  /**
   * Stop Tracking the Pointer.
   */
  private unregisterPointerEvents(): void {
    if (!this._isFollowingPointer) {
      return;
    }

    this._isFollowingPointer = false;
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerdown", this.onPointer);
  }

  /**
   * Record Pointer Position.
   *
   * @param event - Pointer Event
   */
  private readonly onPointer = (event: PointerEvent): void => {
    this.current = { kind: "client", clientX: event.clientX, clientY: event.clientY };
  };
}
