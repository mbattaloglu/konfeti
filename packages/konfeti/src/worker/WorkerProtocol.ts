import type { WorkerFireOptions } from "../types/worker/WorkerFireOptions";

/**
 * Worker Runtime Settings Sent with `init`.
 */
export type WorkerRuntimeSettings = {
  /**
   * Maximum Live Particles.
   */
  readonly maxParticles: number;
  /**
   * Instance Default Burst Options.
   */
  readonly defaults: WorkerFireOptions;
};

/**
 * Message from the Main Thread to the Worker.
 */
export type MainToWorker =
  | {
      readonly type: "init";
      readonly canvas: OffscreenCanvas;
      readonly width: number;
      readonly height: number;
      readonly pixelRatio: number;
      readonly settings: WorkerRuntimeSettings;
    }
  | { readonly type: "fire"; readonly id: number; readonly options: WorkerFireOptions }
  | { readonly type: "control"; readonly id: number; readonly action: "pause" | "resume" | "stop" }
  | { readonly type: "reset" }
  | {
      readonly type: "resize";
      readonly width: number;
      readonly height: number;
      readonly pixelRatio: number;
    }
  | { readonly type: "visibility"; readonly hidden: boolean }
  | { readonly type: "pause"; readonly paused: boolean }
  | { readonly type: "destroy" };

/**
 * Message from the Worker to the Main Thread.
 */
export type WorkerToMain =
  | { readonly type: "ready" }
  | { readonly type: "failed"; readonly message: string }
  | { readonly type: "complete"; readonly id: number }
  | { readonly type: "error"; readonly id: number; readonly message: string }
  | {
      readonly type: "stats";
      readonly total: number;
      readonly spawned: number;
      readonly died: number;
      readonly bursts: readonly (readonly [id: number, count: number])[];
    };
