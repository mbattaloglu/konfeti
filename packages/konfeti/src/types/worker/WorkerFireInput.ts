import type { WorkerFireOptions } from "./WorkerFireOptions";

/**
 * One Worker Burst or Several Worker Bursts Fired Together.
 */
export type WorkerFireInput = WorkerFireOptions | readonly WorkerFireOptions[];
