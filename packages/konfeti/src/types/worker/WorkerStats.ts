/**
 * Worker Instance Counters.
 * Hooks cannot run inside a worker, so a worker instance counts these itself (see
 * `WorkerKonfetiInstance.getStats()`). Updated a few times per second while particles are alive.
 */
export type WorkerStats = {
  /**
   * Live Particles Right Now.
   */
  readonly live: number;
  /**
   * Particles Spawned Since the Instance Was Created.
   */
  readonly spawned: number;
  /**
   * Particles that Died Since the Instance Was Created.
   */
  readonly died: number;
  /**
   * Bursts that Finished Since the Instance Was Created.
   */
  readonly completed: number;
};
