import type { Origin } from "../types/Origin";
import type { OriginPoint } from "../types/OriginPoint";
import type { WorkerFireOptions } from "../types/worker/WorkerFireOptions";

/**
 * Canvas Bounds in Viewport Coordinates.
 */
type Bounds = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Static Main-Thread Preparation of Worker Options.
 * Measures DOM-dependent values the worker cannot see (element and click origins, relative image URLs) and
 * verifies the options survive `postMessage`.
 */
export class WorkerOptionsPreparer {
  /**
   * Prepare Options for Posting.
   *
   * @param options - Worker Burst Options
   * @param bounds - Canvas Bounds in Viewport Coordinates
   * @returns Options with Origins as Normalized Points and Absolute Image URLs
   * @throws TypeError when the options contain values that cannot be sent to a worker
   */
  public static prepare(options: WorkerFireOptions, bounds: Bounds): WorkerFireOptions {
    const prepared: WorkerFireOptions = {
      ...options,
      ...(options.origin === undefined
        ? {}
        : { origin: WorkerOptionsPreparer.toPoint(options.origin, bounds) }),
      ...(options.shapes === undefined
        ? {}
        : { shapes: options.shapes.map((entry) => WorkerOptionsPreparer.absolutizeShape(entry)) }),
    };

    try {
      structuredClone(prepared);
    } catch {
      throw new TypeError(
        "konfeti: worker options must be cloneable — hooks, easing functions, Path2D and DOM images are not supported in worker mode",
      );
    }

    return prepared;
  }

  /**
   * Convert Element and Viewport Origins into Normalized Points.
   *
   * @param origin - Public Origin
   * @param bounds - Canvas Bounds
   * @returns Normalized Point
   */
  public static toPoint(origin: Origin, bounds: Bounds): OriginPoint {
    let clientX: number;
    let clientY: number;

    if (typeof Element !== "undefined" && origin instanceof Element) {
      const rect = origin.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    } else if ("clientX" in origin && "clientY" in origin) {
      clientX = origin.clientX;
      clientY = origin.clientY;
    } else {
      return origin as OriginPoint;
    }

    return {
      x: bounds.width > 0 ? (clientX - bounds.left) / bounds.width : 0.5,
      y: bounds.height > 0 ? (clientY - bounds.top) / bounds.height : 0.5,
    };
  }

  /**
   * Make Image URLs Absolute (the worker runs from a blob: URL, so relative paths would not resolve).
   *
   * @param entry - Shape Entry
   * @returns Entry with Absolute URLs
   */
  private static absolutizeShape<T extends NonNullable<WorkerFireOptions["shapes"]>[number]>(
    entry: T,
  ): T {
    if (entry.type !== "image" && entry.type !== "spritesheet") {
      return entry;
    }

    const absolutize = (value: unknown): unknown => {
      if (typeof value === "string") {
        return new URL(value, document.baseURI).href;
      }

      if (Array.isArray(value)) {
        return value.map(absolutize);
      }

      if (typeof value === "object" && value !== null && "value" in value) {
        return { ...value, value: absolutize(value.value) };
      }

      return value;
    };

    // src keeps its own shape (string | bitmap | weighted list); only string leaves change
    return { ...entry, src: absolutize(entry.src) };
  }
}
