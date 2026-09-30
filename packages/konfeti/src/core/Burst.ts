import type { Particle } from "../particles/Particle";
import { PhysicsPipeline } from "../physics/PhysicsPipeline";
import type { KonfetiHandle } from "../types/KonfetiHandle";
import type { ResolvedFireOptions } from "../types/resolved/ResolvedFireOptions";
import { Random } from "../utils/Random";
import type { BurstOwner } from "./BurstOwner";

/**
 * Spawn Request Callback.
 */
export type SpawnCallback = (burst: Burst, count: number, perShotOrigin: boolean) => void;

/**
 * Single Burst of Particles.
 * Owns its live particles, its seeded random generator, physics pipeline and emission schedule, and
 * implements the public {@link KonfetiHandle}.
 */
export class Burst implements KonfetiHandle {
  /**
   * Milliseconds per Second (continuous emission rates are per second).
   */
  private static readonly MS_PER_SECOND = 1000;

  /**
   * Live Particle List (oldest first).
   */
  private readonly particles: Particle[] = [];

  /**
   * Resolved Burst Options.
   */
  private readonly options: ResolvedFireOptions;

  /**
   * Owning Engine (`null` for bursts that never animate).
   */
  private readonly owner: BurstOwner | null;

  /**
   * Seeded Random Generator.
   */
  private readonly random: Random;

  /**
   * Physics Pipeline.
   */
  private readonly pipeline: PhysicsPipeline;

  /**
   * Completion Promise.
   */
  private readonly promise: Promise<void>;

  /**
   * Completion Promise Resolver.
   */
  private readonly resolvePromise: () => void;

  /**
   * Emission Time Elapsed in Milliseconds.
   */
  private emissionElapsed = 0;

  /**
   * Particles Emitted so Far (stream mode).
   */
  private emittedCount = 0;

  /**
   * Shots Emitted so Far (interval mode).
   */
  private emittedShots = 0;

  /**
   * Sequence Color Counter.
   */
  private sequenceIndex = 0;

  /**
   * Paused State Flag.
   */
  private _isPaused = false;

  /**
   * Finished State Flag.
   */
  private _isFinished = false;

  /**
   * Stop Requested Flag.
   */
  private _isStopRequested = false;

  /**
   * Emission Done Flag.
   */
  private _isEmissionDone = false;

  /**
   * Started Flag (onStart fired).
   */
  private _isStarted = false;

  /**
   * Create Burst.
   *
   * @param options - Resolved Burst Options
   * @param owner - Owning Engine (`null` creates an already-finished burst)
   */
  public constructor(options: ResolvedFireOptions, owner: BurstOwner | null) {
    let resolver: () => void = () => undefined;
    this.promise = new Promise<void>((resolve) => {
      resolver = resolve;
    });
    this.resolvePromise = resolver;
    this.options = options;
    this.owner = owner;
    this.random = new Random(options.seed);
    this.pipeline = new PhysicsPipeline(options.physics, options.formation);

    if (owner === null) {
      this._isEmissionDone = true;
      this.finish();
    }
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
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onFulfilled, onRejected);
  }

  /**
   * Freeze Burst in Place (emission pauses too).
   */
  public pause(): void {
    this._isPaused = true;
  }

  /**
   * Resume Paused Burst.
   */
  public resume(): void {
    if (!this._isPaused) {
      return;
    }

    this._isPaused = false;
    this.owner?.requestFrame();
  }

  /**
   * Remove Burst Immediately (cancels pending emission).
   */
  public stop(): void {
    if (this._isFinished) {
      return;
    }

    this._isStopRequested = true;
    this._isEmissionDone = true;
    this.owner?.requestFrame();
  }

  /**
   * End Emission but Keep Live Particles (continuous emitters' stop()).
   */
  public endEmission(): void {
    if (this._isEmissionDone) {
      return;
    }

    this._isEmissionDone = true;
    this.owner?.requestFrame();
  }

  /**
   * Advance Emission Schedule and Request Spawns.
   *
   * @param dtMs - Time Step in Milliseconds
   * @param spawn - Spawn Callback
   */
  public advanceEmission(dtMs: number, spawn: SpawnCallback): void {
    if (this._isEmissionDone) {
      return;
    }

    const emission = this.options.emission;
    const count = this.options.particleCount;
    this.emissionElapsed += dtMs;

    switch (emission.mode) {
      case "burst":
        if (this.options.formation === null) {
          this.requestSpawn(spawn, count, false);
          this._isEmissionDone = true;
        } else {
          this.emitFormation(spawn);
        }
        break;
      case "stream": {
        const progress = Math.min(this.emissionElapsed / emission.duration, 1);
        // the +1 emits the first particle on the very first tick
        const due = Math.min(count, Math.floor(progress * count) + 1);
        this.requestSpawn(spawn, due - this.emittedCount, false);
        this.emittedCount = Math.max(this.emittedCount, due);
        this._isEmissionDone = this.emittedCount >= count || progress >= 1;
        break;
      }
      case "continuous": {
        // everything due so far, minus what was already requested: fractional rates add up over time
        const due = Math.floor((this.emissionElapsed / Burst.MS_PER_SECOND) * emission.rate);
        this.requestSpawn(spawn, due - this.emittedCount, false);
        this.emittedCount = due;
        break;
      }
      case "interval": {
        const dueShots = Math.min(
          emission.times,
          Math.floor(this.emissionElapsed / emission.every) + 1,
        );

        while (this.emittedShots < dueShots) {
          this.requestSpawn(spawn, count, true);
          this.emittedShots++;
        }

        this._isEmissionDone = this.emittedShots >= emission.times;
        break;
      }
    }
  }

  /**
   * Emit a Formation once Its Shape Is Ready (an image may still be loading; a failed one emits nothing).
   *
   * @param spawn - Spawn Callback
   */
  private emitFormation(spawn: SpawnCallback): void {
    const formation = this.options.formation;
    const origin = this.options.origin;

    if (formation === null || formation.hasFailed() || origin.kind === "tracked") {
      this._isEmissionDone = true;
      return;
    }

    if (!formation.isReady() || this.owner === null) {
      return;
    }

    this.requestSpawn(
      spawn,
      formation.prepare(this.owner.getSurface(), origin, this.random),
      false,
    );
    this._isEmissionDone = true;
  }

  /**
   * Return Next Sequence Color Index.
   *
   * @returns Monotonic Particle Index
   */
  public nextSequenceIndex(): number {
    return this.sequenceIndex++;
  }

  /**
   * Return Paused State.
   *
   * @returns Paused State
   */
  public isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Return Finished State.
   *
   * @returns Finished State
   */
  public isFinished(): boolean {
    return this._isFinished;
  }

  /**
   * Return Stop Requested State.
   *
   * @returns Stop Requested State
   */
  public isStopRequested(): boolean {
    return this._isStopRequested;
  }

  /**
   * Return Emission Done State.
   *
   * @returns Emission Done State
   */
  public isEmissionDone(): boolean {
    return this._isEmissionDone;
  }

  /**
   * Return Live Particle Count.
   *
   * @returns Live Particle Count
   */
  public getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Return the Random Seed.
   *
   * @returns Seed
   */
  public getSeed(): number {
    return this.options.seed;
  }

  /**
   * Return Live Particle List (engine use only).
   *
   * @returns Mutable Particle List
   */
  public getParticles(): Particle[] {
    return this.particles;
  }

  /**
   * Return Resolved Options.
   *
   * @returns Resolved Burst Options
   */
  public getOptions(): ResolvedFireOptions {
    return this.options;
  }

  /**
   * Return Seeded Random Generator.
   *
   * @returns Random Generator
   */
  public getRandom(): Random {
    return this.random;
  }

  /**
   * Return Physics Pipeline.
   *
   * @returns Physics Pipeline
   */
  public getPipeline(): PhysicsPipeline {
    return this.pipeline;
  }

  /**
   * Add Spawned Particle.
   *
   * @param particle - Spawned Particle
   */
  public add(particle: Particle): void {
    this.particles.push(particle);
    this.options.hooks.onParticleSpawn?.(particle);
  }

  /**
   * Mark Burst Finished, Run onComplete and Resolve Handle.
   */
  public finish(): void {
    if (this._isFinished) {
      return;
    }

    this._isFinished = true;
    this._isEmissionDone = true;
    // e.g. the attractor's pointer listeners live exactly as long as the burst
    this.pipeline.dispose();
    this.options.hooks.onComplete?.();
    this.resolvePromise();
  }

  /**
   * Request Spawn and Fire onStart Once.
   *
   * @param spawn - Spawn Callback
   * @param count - Particle Count
   * @param perShotOrigin - Sample Origin Once per Shot Flag
   */
  private requestSpawn(spawn: SpawnCallback, count: number, perShotOrigin: boolean): void {
    if (count <= 0) {
      return;
    }

    spawn(this, count, perShotOrigin);

    if (!this._isStarted) {
      this._isStarted = true;
      this.options.hooks.onStart?.();
    }
  }
}
