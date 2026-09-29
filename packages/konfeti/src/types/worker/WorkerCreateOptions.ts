import type { CreateOptions } from "../CreateOptions";
import type { WorkerFireOptions } from "./WorkerFireOptions";

/**
 * Options for a Worker Instance.
 *
 * @example
 * ```ts
 * const stage = createWorker(canvas, {
 *   maxParticles: 3000,
 *   defaults: { paper: { colors: ["gold", "white"] } },
 * });
 * ```
 */
export type WorkerCreateOptions = Omit<CreateOptions, "defaults" | "frameScheduler"> & {
  /**
   * Instance Default Burst Options (worker-safe).
   *
   * @defaultValue `{}`
   */
  readonly defaults?: WorkerFireOptions;
  /**
   * Worker Script URL.
   * With a bundler the worker is created from an inlined script (a `blob:` URL), downloaded only when the first
   * worker instance is created. The `<script>` build (`konfeti.iife.js`) loads `konfeti.worker.js` from its own
   * folder instead. Set this to a self-hosted copy of `konfeti/konfeti.worker.js` when your Content-Security-Policy does
   * not allow `worker-src blob:`, or when the script build is served without the worker file next to it.
   *
   * @defaultValue inlined worker (bundlers) / `konfeti.worker.js` next to the script (`<script>` build)
   * @example
   * ```ts
   * createWorker(canvas, { workerUrl: "/vendor/konfeti.worker.js" });
   * ```
   */
  readonly workerUrl?: string | URL;
};
