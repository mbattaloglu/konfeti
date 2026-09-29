import { Banner } from "../utils/Banner";
import { GroupHandle } from "../core/GroupHandle";
import { KonfetiInstance } from "../core/KonfetiInstance";
import { OverlayCanvas } from "../core/OverlayCanvas";
import { OptionResolver } from "../core/resolve/OptionResolver";
import type { KonfetiHandle } from "../types/KonfetiHandle";
import type { ResolvedCreateOptions } from "../types/resolved/ResolvedCreateOptions";
import type { WorkerCreateOptions } from "../types/worker/WorkerCreateOptions";
import type { WorkerFireInput } from "../types/worker/WorkerFireInput";
import type { WorkerFireOptions } from "../types/worker/WorkerFireOptions";
import { EnvUtils } from "../utils/EnvUtils";
import { WorkerBurstHandle } from "./WorkerBurstHandle";
import { WorkerOptionsPreparer } from "./WorkerOptionsPreparer";
import type { WorkerPort } from "./WorkerPort";
import type { MainToWorker, WorkerToMain } from "./WorkerProtocol";

/**
 * Worker Connector (injectable for tests).
 */
export type WorkerConnector = (url: string | URL | undefined) => Promise<WorkerPort>;

/**
 * Konfeti Instance that Simulates and Draws in a Web Worker.
 * The canvas is handed to the worker as an `OffscreenCanvas`, so confetti stays smooth while the page is busy.
 * Without `OffscreenCanvas` support it transparently falls back to the main thread (`isWorker()` is `false`).
 * Created by `KonfetiFactory.createWorker()`.
 */
export class WorkerKonfetiInstance {
  /**
   * Renderer Name Shown in the Console Banner.
   */
  private static readonly RENDERER_NAME = "worker · offscreen canvas 2d";

  /**
   * Error Message when the Worker Script Fails to Load or Crashes.
   */
  private static readonly SCRIPT_ERROR =
    "konfeti: the worker script failed to load or crashed — check workerUrl and the CSP worker-src directive";

  /**
   * Resolved Instance Options.
   */
  private readonly options: ResolvedCreateOptions;

  /**
   * Canvas Element (transferred to the worker).
   */
  private readonly canvas: HTMLCanvasElement;

  /**
   * Built-in Overlay Flag.
   */
  private readonly _isOverlay: boolean;

  /**
   * Main-Thread Fallback (`null` in worker mode).
   */
  private readonly fallback: KonfetiInstance | null;

  /**
   * Live Burst Handles by Id.
   */
  private readonly handles = new Map<number, WorkerBurstHandle>();

  /**
   * Messages Waiting for the Worker to Start.
   */
  private readonly queue: { message: MainToWorker; transfer: Transferable[] }[] = [];

  /**
   * Active Click Listener Removers.
   */
  private readonly clickListeners = new Set<() => void>();

  /**
   * Worker Port (`null` until connected).
   */
  private port: WorkerPort | null = null;

  /**
   * Next Burst Id.
   */
  private nextId = 1;

  /**
   * Last Reported Live Particle Count.
   */
  private particleCount = 0;

  /**
   * Last Sent Size Key (skips duplicate resize messages).
   */
  private lastSize = "";

  /**
   * Resize Observer (user canvases only).
   */
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Startup Failure Message (`null` while healthy).
   */
  private failure: string | null = null;

  /**
   * Destroyed State Flag.
   */
  private _isDestroyed = false;

  /**
   * Create Worker Instance.
   *
   * @param canvas - Target Canvas (`null` creates a fullscreen overlay)
   * @param options - Worker Instance Options
   * @param connect - Worker Connector (defaults to the bundled worker script)
   */
  public constructor(
    canvas: HTMLCanvasElement | null = null,
    options: WorkerCreateOptions = {},
    connect: WorkerConnector = async (url) => WorkerKonfetiInstance.connectDefault(url),
  ) {
    const { workerUrl, ...createOptions } = options;
    this.options = OptionResolver.resolveCreate(createOptions);
    this._isOverlay = canvas === null;
    this.canvas = canvas ?? OverlayCanvas.create(this.options.zIndex);

    if (!WorkerKonfetiInstance.isSupported(this.canvas)) {
      this.fallback = new KonfetiInstance(this.canvas, createOptions);
      return;
    }

    Banner.show(WorkerKonfetiInstance.RENDERER_NAME);

    this.fallback = null;
    const offscreen = this.canvas.transferControlToOffscreen();
    const size = this.measure();

    this.enqueue(
      {
        type: "init",
        canvas: offscreen,
        ...size,
        settings: {
          maxParticles: this.options.maxParticles,
          defaults: WorkerOptionsPreparer.prepare(
            this.options.defaults as WorkerFireOptions,
            this.getBounds(),
          ),
        },
      },
      [offscreen],
    );
    this.registerResizeEvents();
    this.registerVisibilityEvents();

    connect(workerUrl)
      .then((port) => {
        this.attach(port);
      })
      .catch((error: unknown) => {
        this.failAll(error instanceof Error ? error.message : "konfeti: worker failed to start");
      });
  }

  /**
   * Check Browser Support for Worker Rendering.
   *
   * @param canvas - Target Canvas
   * @returns Supported Flag
   */
  public static isSupported(canvas: HTMLCanvasElement): boolean {
    return (
      typeof Worker !== "undefined" &&
      typeof OffscreenCanvas !== "undefined" &&
      typeof canvas.transferControlToOffscreen === "function"
    );
  }

  /**
   * Fire Burst (or Several Bursts at Once).
   *
   * @param input - Worker-Safe Burst Options, or an Array of Them
   * @returns Awaitable Burst Handle (rejects if the worker reports invalid options)
   * @throws Error when destroyed, TypeError when the options cannot be sent to the worker
   * @example
   * ```ts
   * const stage = KonfetiFactory.createWorker(canvas);
   * await stage.fire({ particleCount: 300, spread: 360 });
   * ```
   */
  public fire(input: WorkerFireInput = {}): KonfetiHandle {
    if (this._isDestroyed) {
      throw new Error("konfeti: cannot fire on a destroyed instance");
    }

    if (this.fallback !== null) {
      return this.fallback.fire(input);
    }

    if (WorkerKonfetiInstance.isList(input)) {
      return new GroupHandle(input.map((options) => this.fireOne(options)));
    }

    return this.fireOne(input);
  }

  /**
   * Fire on Every Click.
   * Bursts start at the click position unless the options set their own `origin`.
   *
   * @param target - Element (or `window`) to Listen On
   * @param options - Worker-Safe Burst Options, or a Function Building Them from the Click Event
   * @returns Unsubscribe Function
   */
  public onClick(
    target: Element | Window,
    options?: WorkerFireInput | ((event: MouseEvent) => WorkerFireInput),
  ): () => void {
    const handleClick = (event: Event): void => {
      if (!(event instanceof MouseEvent) || this._isDestroyed) {
        return;
      }

      const input = typeof options === "function" ? options(event) : (options ?? {});
      const origin = { clientX: event.clientX, clientY: event.clientY };
      const withOrigin = (entry: WorkerFireOptions): WorkerFireOptions =>
        entry.origin === undefined ? { ...entry, origin } : entry;

      this.fire(WorkerKonfetiInstance.isList(input) ? input.map(withOrigin) : withOrigin(input));
    };

    const unsubscribe = (): void => {
      target.removeEventListener("click", handleClick);
      this.clickListeners.delete(unsubscribe);
    };

    target.addEventListener("click", handleClick);
    this.clickListeners.add(unsubscribe);
    return unsubscribe;
  }

  /**
   * Stop All Bursts and Clear Canvas.
   */
  public reset(): void {
    if (this.fallback !== null) {
      this.fallback.reset();
      return;
    }

    this.send({ type: "reset" });
    this.completeAll();
  }

  /**
   * Destroy Instance.
   * Stops the worker, removes listeners and the overlay canvas.
   */
  public destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;
    this.unregisterClickListeners();

    if (this.fallback !== null) {
      this.fallback.destroy();
      return;
    }

    this.send({ type: "destroy" });
    this.completeAll();
    this.unregisterResizeEvents();
    this.unregisterVisibilityEvents();
    this.port?.terminate();
    this.port = null;

    if (this._isOverlay) {
      this.canvas.remove();
    }
  }

  /**
   * Return Live Particle Count.
   *
   * @returns Particle Count (worker mode: updated a few times per second)
   */
  public getParticleCount(): number {
    return this.fallback?.getParticleCount() ?? this.particleCount;
  }

  /**
   * Return Canvas Element.
   *
   * @returns Canvas Element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.fallback?.getCanvas() ?? this.canvas;
  }

  /**
   * Return Worker Mode State.
   *
   * @returns `true` when drawing happens in a worker, `false` for the main-thread fallback
   */
  public isWorker(): boolean {
    return this.fallback === null;
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
   * Fire Single Burst in the Worker.
   *
   * @param options - Worker-Safe Burst Options
   * @returns Burst Handle
   */
  private fireOne(options: WorkerFireOptions): KonfetiHandle {
    const id = this.nextId++;
    const handle = new WorkerBurstHandle((action) => {
      this.send({ type: "control", id, action });
    });

    if (this.failure !== null) {
      handle.fail(this.failure);
      return handle;
    }

    if (this.options.disableForReducedMotion && EnvUtils.prefersReducedMotion()) {
      handle.complete();
      return handle;
    }

    if (this._isOverlay) {
      OverlayCanvas.mount(this.canvas);
      this.syncSize();
    }

    const prepared = WorkerOptionsPreparer.prepare(options, this.getBounds());
    this.handles.set(id, handle);
    this.send({ type: "fire", id, options: prepared });
    return handle;
  }

  /**
   * Connect Worker Port and Flush Queued Messages.
   *
   * @param port - Worker Port
   */
  private attach(port: WorkerPort): void {
    if (this._isDestroyed) {
      port.terminate();
      return;
    }

    this.port = port;
    port.onmessage = (event) => {
      this.receive(event.data);
    };
    port.onerror = () => {
      this.failAll(WorkerKonfetiInstance.SCRIPT_ERROR);
    };

    for (const { message, transfer } of this.queue.splice(0)) {
      port.postMessage(message, transfer);
    }
  }

  /**
   * Receive Message from the Worker.
   *
   * @param message - Protocol Message
   */
  private receive(message: WorkerToMain): void {
    switch (message.type) {
      case "ready":
        break;
      case "failed":
        this.failAll(message.message);
        break;
      case "complete":
        this.settle(message.id)?.complete();
        break;
      case "error":
        this.settle(message.id)?.fail(message.message);
        break;
      case "stats":
        this.particleCount = message.total;
        for (const [id, count] of message.bursts) {
          this.handles.get(id)?.setParticleCount(count);
        }
        break;
    }
  }

  /**
   * Forget a Finished Burst and Drop Its Particles from the Total Right Away.
   * Stats only arrive every few hundred milliseconds; without this, `getParticleCount()` would still report
   * the burst after its promise resolved.
   *
   * @param id - Burst Id
   * @returns The Burst's Handle, if Still Known
   */
  private settle(id: number): WorkerBurstHandle | undefined {
    const handle = this.handles.get(id);

    if (handle !== undefined) {
      this.handles.delete(id);
      this.particleCount = Math.max(0, this.particleCount - handle.getParticleCount());
    }

    return handle;
  }

  /**
   * Send Message (queued until the worker is connected).
   *
   * @param message - Protocol Message
   */
  private send(message: MainToWorker): void {
    this.enqueue(message, []);
  }

  /**
   * Post or Queue Message.
   *
   * @param message - Protocol Message
   * @param transfer - Objects to Transfer
   */
  private enqueue(message: MainToWorker, transfer: Transferable[]): void {
    if (this.port === null) {
      this.queue.push({ message, transfer });
    } else {
      this.port.postMessage(message, transfer);
    }
  }

  /**
   * Resolve Every Pending Handle (reset / destroy).
   */
  private completeAll(): void {
    for (const handle of this.handles.values()) {
      handle.complete();
    }

    this.handles.clear();
    this.particleCount = 0;
  }

  /**
   * Reject Every Pending Handle and Every Later Burst.
   *
   * @param message - Error Message
   */
  private failAll(message: string): void {
    this.failure = message;

    for (const handle of this.handles.values()) {
      handle.fail(message);
    }

    this.handles.clear();
  }

  /**
   * Measure CSS Size and Pixel Ratio.
   *
   * @returns Size Message Fields
   */
  private measure(): { width: number; height: number; pixelRatio: number } {
    const pixelRatio = EnvUtils.getDevicePixelRatio(this.options.maxDevicePixelRatio);

    if (this._isOverlay) {
      return { width: window.innerWidth, height: window.innerHeight, pixelRatio };
    }

    return {
      width: this.canvas.clientWidth || this.canvas.width,
      height: this.canvas.clientHeight || this.canvas.height,
      pixelRatio,
    };
  }

  /**
   * Return Canvas Bounds in Viewport Coordinates.
   *
   * @returns Bounds
   */
  private getBounds(): { left: number; top: number; width: number; height: number } {
    if (this._isOverlay || !this.canvas.isConnected) {
      const { width, height } = this.measure();
      return { left: 0, top: 0, width, height };
    }

    const rect = this.canvas.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  /**
   * Send Size to the Worker if It Changed.
   */
  private readonly syncSize = (): void => {
    const size = this.measure();
    const key = `${String(size.width)}x${String(size.height)}@${String(size.pixelRatio)}`;

    if (key !== this.lastSize) {
      this.lastSize = key;
      this.send({ type: "resize", ...size });
    }
  };

  /**
   * Register Resize Listeners.
   */
  private registerResizeEvents(): void {
    this.lastSize = "";

    if (!this.options.resize) {
      return;
    }

    if (this._isOverlay || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", this.syncSize);
      return;
    }

    this.resizeObserver = new ResizeObserver(this.syncSize);
    this.resizeObserver.observe(this.canvas);
  }

  /**
   * Unregister Resize Listeners.
   */
  private unregisterResizeEvents(): void {
    window.removeEventListener("resize", this.syncSize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  /**
   * Register Page Visibility Listener.
   */
  private registerVisibilityEvents(): void {
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  /**
   * Unregister Page Visibility Listener.
   */
  private unregisterVisibilityEvents(): void {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
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
    this.send({ type: "visibility", hidden: document.hidden });
  };

  /**
   * Check Fire Input List Form.
   *
   * @param input - Worker Fire Input
   * @returns List Flag
   */
  private static isList(input: WorkerFireInput): input is readonly WorkerFireOptions[] {
    return Array.isArray(input);
  }

  /**
   * Connect the Bundled Worker (loaded on demand so the script only downloads when needed).
   *
   * @param url - Self-Hosted Worker Script, or Undefined for the Inlined One
   * @returns Worker Port
   */
  private static async connectDefault(url: string | URL | undefined): Promise<WorkerPort> {
    const { spawnWorker } = await import("./spawnWorker");
    return spawnWorker(url);
  }
}
