import type { EmitterTarget } from "../types/EmitterTarget";
import type { OriginPoint } from "../types/OriginPoint";

/**
 * Main-Thread Follower of a Target the Worker Cannot See.
 * Follows the pointer through `pointermove` / `pointerdown` and an element through a per-frame measurement, and
 * hands every new place to a sender as a normalized canvas point. Worker emitters use it for their origin,
 * worker attractors for their target.
 */
export class WorkerTargetFollower {
  /**
   * Sends a New Place to the Worker (`null` hides it).
   */
  private readonly send: (at: OriginPoint | null) => void;

  /**
   * Converts an Element or Viewport Point into a Normalized Canvas Point.
   */
  private readonly measure: (origin: Element | { clientX: number; clientY: number }) => OriginPoint;

  /**
   * Followed Element (measured every frame), or Null.
   */
  private element: Element | null = null;

  /**
   * Last Point Sent for the Followed Element.
   */
  private lastSent = "";

  /**
   * Element Measuring Frame Id, or Null.
   */
  private frameId: number | null = null;

  /**
   * Pointer Listeners Registered Flag.
   */
  private _isFollowingPointer = false;

  /**
   * Create Follower.
   *
   * @param send - Place Sender
   * @param measure - Element / Viewport Point to Normalized Point Converter
   */
  public constructor(
    send: (at: OriginPoint | null) => void,
    measure: (origin: Element | { clientX: number; clientY: number }) => OriginPoint,
  ) {
    this.send = send;
    this.measure = measure;
  }

  /**
   * Return the First Place of a Target (sent along with the message that starts the burst).
   *
   * @param target - Element, `"pointer"` or Normalized Point
   * @param measure - Element / Viewport Point to Normalized Point Converter
   * @returns Normalized Point, or Null for the Pointer (unknown until it moves)
   */
  public static initialPlace(
    target: EmitterTarget,
    measure: (origin: Element | { clientX: number; clientY: number }) => OriginPoint,
  ): OriginPoint | null {
    if (target === "pointer") {
      return null;
    }

    return WorkerTargetFollower.isElement(target) ? measure(target) : target;
  }

  /**
   * Check Whether a Target Is an Element (and not the pointer or a point).
   *
   * @param target - Emitter Target
   * @returns Element Flag
   */
  public static isElement(target: EmitterTarget): target is Element {
    return typeof Element !== "undefined" && target instanceof Element;
  }

  /**
   * Start Following a Target (stops following the previous one).
   *
   * @param target - Element, `"pointer"` or Normalized Point
   * @param announce - Send the New Place Now (false when the first place already rode on the start message)
   */
  public follow(target: EmitterTarget, announce: boolean): void {
    this.unfollow();

    if (target === "pointer") {
      if (announce) {
        this.send(null);
      }
      this.registerPointerEvents();
      return;
    }

    if (WorkerTargetFollower.isElement(target)) {
      this.element = target;
      this.lastSent = announce ? "" : JSON.stringify(this.measure(target));
      this.trackElement();
      return;
    }

    if (announce) {
      this.send(target);
    }
  }

  /**
   * Stop Following (pointer listeners and element measuring).
   */
  public unfollow(): void {
    this.element = null;

    if (this.frameId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.frameId);
    }

    this.frameId = null;
    this.unregisterPointerEvents();
  }

  /**
   * Measure the Followed Element Every Frame and Send It when It Moved.
   */
  private readonly trackElement = (): void => {
    const element = this.element;

    if (element === null || typeof requestAnimationFrame === "undefined") {
      return;
    }

    const at = this.measure(element);
    const key = JSON.stringify(at);

    if (key !== this.lastSent) {
      this.lastSent = key;
      this.send(at);
    }

    this.frameId = requestAnimationFrame(this.trackElement);
  };

  /**
   * Start Sending Pointer Positions.
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
   * Stop Sending Pointer Positions.
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
   * Send Pointer Position.
   *
   * @param event - Pointer Event
   */
  private readonly onPointer = (event: PointerEvent): void => {
    this.send(this.measure({ clientX: event.clientX, clientY: event.clientY }));
  };
}
