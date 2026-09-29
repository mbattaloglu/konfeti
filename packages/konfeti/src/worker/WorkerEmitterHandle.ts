import type { EmitterTarget } from "../types/EmitterTarget";
import type { KonfetiEmitter } from "../types/KonfetiEmitter";
import type { OriginPoint } from "../types/OriginPoint";
import type { WorkerBurstHandle } from "./WorkerBurstHandle";

/**
 * Continuous Emitter Handle (worker mode).
 * The worker cannot see the DOM, so this handle follows the target on the main thread — the pointer through
 * `pointermove`, an element through a per-frame measurement — and sends it over as a normalized point.
 */
export class WorkerEmitterHandle implements KonfetiEmitter {
  /**
   * Burst Handle Mirroring the Worker-Side Emitter.
   */
  private readonly handle: WorkerBurstHandle;

  /**
   * Sends the Emitter's New Place to the Worker.
   */
  private readonly move: (at: OriginPoint | null) => void;

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
   * Emitting State Flag.
   */
  private _isEmitting = true;

  /**
   * Create Handle.
   *
   * @param handle - Burst Handle of the Worker Emitter
   * @param move - Place Sender
   * @param measure - Element / Viewport Point to Normalized Point Converter
   * @param target - Initial Target
   */
  public constructor(
    handle: WorkerBurstHandle,
    move: (at: OriginPoint | null) => void,
    measure: (origin: Element | { clientX: number; clientY: number }) => OriginPoint,
    target: EmitterTarget,
  ) {
    this.handle = handle;
    this.move = move;
    this.measure = measure;
    this.follow(target, false);

    const detach = (): void => {
      this._isEmitting = false;
      this.unfollow();
    };
    void handle.then(detach, detach);
  }

  /**
   * Return the First Place to Send with the Emit Message.
   *
   * @param target - Initial Target
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

    return WorkerEmitterHandle.isElement(target) ? measure(target) : target;
  }

  /**
   * Check Whether a Target Is an Element (and not the pointer or a point).
   *
   * @param target - Emitter Target
   * @returns Element Flag
   */
  private static isElement(target: EmitterTarget): target is Element {
    return typeof Element !== "undefined" && target instanceof Element;
  }

  /**
   * Attach Promise Callbacks.
   *
   * @param onFulfilled - Completion Callback
   * @param onRejected - Rejection Callback
   * @returns Chained Promise
   */
  public then<TResult1 = void, TResult2 = never>(
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- mirrors PromiseLike<void>.then
    onFulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.handle.then(onFulfilled, onRejected);
  }

  /**
   * Stop Emitting (live particles finish in the worker).
   */
  public stop(): void {
    if (this._isEmitting) {
      this._isEmitting = false;
      this.unfollow();
      this.handle.end();
    }
  }

  /**
   * Stop and Remove Every Particle Now.
   */
  public clear(): void {
    this._isEmitting = false;
    this.unfollow();
    this.handle.stop();
  }

  /**
   * Change What the Emitter Follows.
   *
   * @param target - Element, `"pointer"` or Normalized Point
   */
  public moveTo(target: EmitterTarget): void {
    if (this._isEmitting) {
      this.follow(target, true);
    }
  }

  /**
   * Freeze Emitter and Particles.
   */
  public pause(): void {
    this.handle.pause();
  }

  /**
   * Continue After pause().
   */
  public resume(): void {
    this.handle.resume();
  }

  /**
   * Return Paused State.
   *
   * @returns Paused Flag
   */
  public isPaused(): boolean {
    return this.handle.isPaused();
  }

  /**
   * Return Emitting State.
   *
   * @returns Emitting Flag
   */
  public isEmitting(): boolean {
    return this._isEmitting;
  }

  /**
   * Return Finished State.
   *
   * @returns Finished Flag
   */
  public isFinished(): boolean {
    return this.handle.isFinished();
  }

  /**
   * Return Last Reported Particle Count.
   *
   * @returns Particle Count (updated a few times per second)
   */
  public getParticleCount(): number {
    return this.handle.getParticleCount();
  }

  /**
   * Start Following a Target.
   *
   * @param target - Element, `"pointer"` or Normalized Point
   * @param announce - Send the New Place Now (false for the initial target, which rides on the emit message)
   */
  private follow(target: EmitterTarget, announce: boolean): void {
    this.unfollow();

    if (target === "pointer") {
      if (announce) {
        this.move(null);
      }
      this.registerPointerEvents();
      return;
    }

    if (WorkerEmitterHandle.isElement(target)) {
      this.element = target;
      this.lastSent = announce ? "" : JSON.stringify(this.measure(target));
      this.trackElement();
      return;
    }

    if (announce) {
      this.move(target);
    }
  }

  /**
   * Stop Following (pointer listeners and element measuring).
   */
  private unfollow(): void {
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
      this.move(at);
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
    this.move(this.measure({ clientX: event.clientX, clientY: event.clientY }));
  };
}
