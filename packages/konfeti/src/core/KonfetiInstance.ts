import { Announcer } from "../utils/Announcer";
import { Canvas2DRenderer } from "../renderers/Canvas2DRenderer";
import type { ClickOptions } from "../types/ClickOptions";
import type { CreateOptions } from "../types/CreateOptions";
import type { FireInput } from "../types/FireInput";
import type { FireOptions } from "../types/FireOptions";
import type { FrameScheduler } from "../types/FrameScheduler";
import type { KonfetiHandle } from "../types/KonfetiHandle";
import type { ResolvedCreateOptions } from "../types/resolved/ResolvedCreateOptions";
import { EnvUtils } from "../utils/EnvUtils";
import { Burst } from "./Burst";
import { CanvasSurface } from "./CanvasSurface";
import { Engine } from "./Engine";
import { GroupHandle } from "./GroupHandle";
import { OptionResolver } from "./resolve/OptionResolver";
import { ParticlePool } from "./ParticlePool";

/**
 * Konfeti Instance.
 * Binds a canvas (or a fullscreen overlay) to its own engine, pool and default options.
 *
 * @example
 * ```ts
 * const konfeti = new KonfetiInstance(document.querySelector("canvas"), { maxParticles: 500 });
 * await konfeti.fire({ particleCount: 100 });
 * konfeti.destroy();
 * ```
 */
export class KonfetiInstance {
  /**
   * Renderer Name Announced on Creation (shown by the console banner).
   */
  private static readonly RENDERER_NAME = "canvas 2d";

  /**
   * Resolved Instance Options.
   */
  private readonly options: ResolvedCreateOptions;

  /**
   * Canvas Surface.
   */
  private readonly surface: CanvasSurface;

  /**
   * Animation Engine.
   */
  private readonly engine: Engine;

  /**
   * Particle Pool.
   */
  private readonly pool: ParticlePool;

  /**
   * Active Click Listener Removers (released on `destroy()`).
   */
  private readonly clickListeners = new Set<() => void>();

  /**
   * Destroyed State Flag.
   */
  private _isDestroyed = false;

  /**
   * Create Instance.
   *
   * @param canvas - Target Canvas (`null` or omitted creates a fullscreen overlay on first `fire()`)
   * @param options - Instance Options
   */
  public constructor(canvas: HTMLCanvasElement | null = null, options: CreateOptions = {}) {
    this.options = OptionResolver.resolveCreate(options);
    this.surface = new CanvasSurface(canvas, this.options);
    this.pool = new ParticlePool();
    this.engine = new Engine(
      this.surface,
      new Canvas2DRenderer(),
      this.options.frameScheduler ?? KonfetiInstance.createDefaultScheduler(),
      this.pool,
      this.options.maxParticles,
    );
    this.registerVisibilityEvents();
    Announcer.announce(KonfetiInstance.RENDERER_NAME);
  }

  /**
   * Fire Burst (or Several Bursts at Once).
   *
   * @param input - Burst Options (merged over the instance `defaults`), or an array of them
   * @returns Awaitable Burst Handle (a combined handle for arrays)
   * @throws Error when the instance was destroyed, TypeError on invalid options
   */
  public fire(input: FireInput = {}): KonfetiHandle {
    if (this._isDestroyed) {
      throw new Error("konfeti: cannot fire on a destroyed instance");
    }

    if (KonfetiInstance.isList(input)) {
      return new GroupHandle(input.map((options) => this.fireOne(options)));
    }

    return this.fireOne(input);
  }

  /**
   * Fire on Every Click.
   * Bursts start at the click position unless the options set their own `origin`.
   *
   * @param target - Element (or `window`) to Listen On
   * @param options - Burst Options, or a Function Building Them from the Click Event
   * @param settings - Trigger Event and Burst Callback
   * @returns Unsubscribe Function
   * @example
   * ```ts
   * const off = Konfeti.onClick(document.querySelector("#like")!, { particleCount: 30, spread: 70 });
   * off(); // stop listening
   * ```
   */
  public onClick(
    target: Element | Window,
    options?: FireInput | ((event: MouseEvent) => FireInput),
    settings: ClickOptions = {},
  ): () => void {
    const trigger = settings.trigger ?? "click";
    const handleClick = (event: Event): void => {
      if (!(event instanceof MouseEvent) || this._isDestroyed) {
        return;
      }

      const input = typeof options === "function" ? options(event) : (options ?? {});
      const withOrigin = (entry: FireOptions): FireOptions =>
        entry.origin === undefined ? { ...entry, origin: event } : entry;

      const handle = this.fire(
        KonfetiInstance.isList(input) ? input.map(withOrigin) : withOrigin(input),
      );
      settings.onFire?.(handle, event);
    };

    const unsubscribe = (): void => {
      target.removeEventListener(trigger, handleClick);
      this.clickListeners.delete(unsubscribe);
    };

    target.addEventListener(trigger, handleClick);
    this.clickListeners.add(unsubscribe);
    return unsubscribe;
  }

  /**
   * Pause Everything.
   * Freezes every running burst on its current frame; bursts fired while paused wait as well. Use it when
   * the confetti is not visible, e.g. on an MRAID `viewableChange` in a playable ad. Hidden tabs already
   * pause automatically.
   *
   * @example
   * ```ts
   * mraid.addEventListener("viewableChange", (viewable) => {
   *   if (viewable) Konfeti.resume();
   *   else Konfeti.pause();
   * });
   * ```
   */
  public pause(): void {
    this.engine.pause();
  }

  /**
   * Resume After pause().
   * Continues exactly where the bursts stopped; the paused time does not count as elapsed.
   */
  public resume(): void {
    this.engine.resume();
  }

  /**
   * Check Whether pause() Is in Effect.
   *
   * @returns Paused Flag
   */
  public isPaused(): boolean {
    return this.engine.isPaused();
  }

  /**
   * Stop All Bursts and Clear Canvas.
   */
  public reset(): void {
    this.engine.clear();
  }

  /**
   * Destroy Instance.
   * Stops everything, removes listeners and the overlay canvas. The instance cannot fire afterwards.
   */
  public destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this.engine.clear();
    this.unregisterClickListeners();
    this.unregisterVisibilityEvents();
    this.surface.destroy();
    this._isDestroyed = true;
  }

  /**
   * Return Live Particle Count.
   *
   * @returns Live Particle Count
   */
  public getParticleCount(): number {
    return this.engine.getParticleCount();
  }

  /**
   * Return Canvas Element.
   *
   * @returns Canvas Element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.surface.getCanvas();
  }

  /**
   * Return Destroyed State.
   *
   * @returns Destroyed State
   */
  public isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Fire Single Burst.
   *
   * @param options - Burst Options
   * @returns Burst Handle
   */
  private fireOne(options: FireOptions): KonfetiHandle {
    this.surface.mount();

    const resolved = OptionResolver.resolveFire([this.options.defaults, options], {
      pixelRatio: this.surface.getPixelRatio(),
    });

    if (this.options.disableForReducedMotion && EnvUtils.prefersReducedMotion()) {
      return new Burst(resolved, null);
    }

    const burst = new Burst(resolved, this.engine);
    this.engine.add(burst);
    return burst;
  }

  /**
   * Check Fire Input List Form.
   *
   * @param input - Fire Input
   * @returns List Flag
   */
  private static isList(input: FireInput): input is readonly FireOptions[] {
    return Array.isArray(input);
  }

  /**
   * Register Page Visibility Listener.
   */
  private registerVisibilityEvents(): void {
    if (EnvUtils.hasDom()) {
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    }
  }

  /**
   * Unregister Page Visibility Listener.
   */
  private unregisterVisibilityEvents(): void {
    if (EnvUtils.hasDom()) {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }
  }

  /**
   * Unregister Every Click Listener Added with `onClick()`.
   */
  private unregisterClickListeners(): void {
    for (const unsubscribe of [...this.clickListeners]) {
      unsubscribe();
    }
  }

  /**
   * Handle Page Visibility Change.
   */
  private readonly onVisibilityChange = (): void => {
    if (document.hidden) {
      this.engine.suspend();
    } else {
      this.engine.unsuspend();
    }
  };

  /**
   * Create requestAnimationFrame Scheduler.
   *
   * @returns Frame Scheduler
   */
  private static createDefaultScheduler(): FrameScheduler {
    return {
      request: (callback) => window.requestAnimationFrame(callback),
      cancel: (id) => {
        window.cancelAnimationFrame(id);
      },
    };
  }
}
