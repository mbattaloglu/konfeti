import type { Particle } from "../particles/Particle";
import { TrailRecorder } from "../particles/TrailRecorder";
import { SpriteAnimator } from "../particles/SpriteAnimator";
import type { PhysicsWorld } from "../physics/abstracts/PhysicsWorld";
import type { Canvas2DRenderer } from "../renderers/Canvas2DRenderer";
import type { FrameScheduler } from "../types/FrameScheduler";
import type { Burst } from "./Burst";
import type { BurstOwner } from "./BurstOwner";
import type { RenderSurface } from "./RenderSurface";
import { Emitter } from "./Emitter";
import type { ParticlePool } from "./ParticlePool";

/**
 * Animation Engine.
 * Runs one frame loop per instance, drives emission schedules, advances unpaused bursts, recycles dead
 * particles and stops itself when nothing is left to animate.
 */
export class Engine implements BurstOwner {
  /**
   * Largest Simulated Step in Seconds (prevents jumps after long frames).
   */
  private static readonly MAX_DELTA_SECONDS = 0.05;

  /**
   * Step Used for the First Frame of a Run.
   */
  private static readonly FIRST_FRAME_SECONDS = 1 / 60;

  /**
   * Milliseconds per Second.
   */
  private static readonly MS_PER_SECOND = 1000;

  /**
   * Simulation Step in Fixed-Timestep Mode, in Seconds.
   */
  private static readonly FIXED_STEP_SECONDS = 1 / 60;

  /**
   * How Early a Fixed Step May Run, in Seconds (frame times jitter around 1/60 s on a 60 Hz screen).
   */
  private static readonly FIXED_STEP_TOLERANCE = 0.002;

  /**
   * Extra Distance below the Canvas before a Falling Particle is Culled.
   */
  private static readonly CULL_MARGIN = 32;

  /**
   * Burst List (oldest first).
   */
  private readonly bursts: Burst[] = [];

  /**
   * Target Surface.
   */
  private readonly surface: RenderSurface;

  /**
   * Renderer.
   */
  private readonly renderer: Canvas2DRenderer;

  /**
   * Frame Scheduler.
   */
  private readonly scheduler: FrameScheduler;

  /**
   * Particle Pool.
   */
  private readonly pool: ParticlePool;

  /**
   * Maximum Live Particles.
   */
  private readonly maxParticles: number;

  /**
   * Fixed-Timestep Mode Flag.
   */
  private readonly fixedTimestep: boolean;

  /**
   * Real Time Not Yet Simulated in Fixed-Timestep Mode, in Seconds.
   */
  private accumulator = 0;

  /**
   * Reused Simulation Bounds.
   */
  private readonly world: PhysicsWorld = { width: 0, height: 0, surface: null };

  /**
   * Pending Frame Request Id.
   */
  private frameId: number | null = null;

  /**
   * Previous Frame Timestamp.
   */
  private lastTime: number | null = null;

  /**
   * Suspended State Flag (document hidden).
   */
  private _isSuspended = false;

  /**
   * Paused State Flag (set by the user; independent of visibility suspension).
   */
  private _isPaused = false;

  /**
   * Create Engine.
   *
   * @param surface - Target Surface
   * @param renderer - Renderer
   * @param scheduler - Frame Scheduler
   * @param pool - Particle Pool
   * @param maxParticles - Maximum Live Particles
   * @param fixedTimestep - Simulate in Fixed 1/60 s Steps Flag
   */
  public constructor(
    surface: RenderSurface,
    renderer: Canvas2DRenderer,
    scheduler: FrameScheduler,
    pool: ParticlePool,
    maxParticles: number,
    fixedTimestep = false,
  ) {
    this.surface = surface;
    this.renderer = renderer;
    this.scheduler = scheduler;
    this.pool = pool;
    this.maxParticles = maxParticles;
    this.fixedTimestep = fixedTimestep;
    this.world.surface = surface;
  }

  /**
   * Add Burst, Run Its Immediate Emission and Start Loop.
   *
   * @param burst - New Burst
   */
  public add(burst: Burst): void {
    this.bursts.push(burst);
    burst.advanceEmission(0, this.spawn);
    this.requestFrame();
  }

  /**
   * Request Animation Frame.
   */
  public requestFrame(): void {
    if (this.frameId === null && !this._isSuspended && !this._isPaused) {
      this.frameId = this.scheduler.request(this.onFrame);
    }
  }

  /**
   * Return the Drawing Surface.
   *
   * @returns Drawing Surface
   */
  public getSurface(): RenderSurface {
    return this.surface;
  }

  /**
   * Suspend Loop (e.g. hidden tab).
   */
  public suspend(): void {
    this._isSuspended = true;
    this.cancelFrame();
  }

  /**
   * Resume Suspended Loop.
   */
  public unsuspend(): void {
    this._isSuspended = false;
    this.lastTime = null;
    this.requestFrame();
  }

  /**
   * Freeze Every Burst on Its Current Frame (bursts fired meanwhile wait too).
   */
  public pause(): void {
    this._isPaused = true;
    this.cancelFrame();
  }

  /**
   * Continue After pause().
   */
  public resume(): void {
    this._isPaused = false;
    // the frozen time must not count as elapsed
    this.lastTime = null;
    this.requestFrame();
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
   * Stop Every Burst and Clear Canvas.
   */
  public clear(): void {
    for (const burst of this.bursts) {
      this.releaseAll(burst);
      burst.finish();
    }

    this.bursts.length = 0;
    this.cancelFrame();
    this.lastTime = null;
    this.accumulator = 0;
    this.renderer.clear(this.surface);
  }

  /**
   * Return Live Particle Count.
   *
   * @returns Live Particle Count
   */
  public getParticleCount(): number {
    let count = 0;

    for (const burst of this.bursts) {
      count += burst.getParticleCount();
    }

    return count;
  }

  /**
   * Return Suspended State.
   *
   * @returns Suspended State
   */
  public isSuspended(): boolean {
    return this._isSuspended;
  }

  /**
   * Spawn Particles for Burst (bound, passed to emission scheduling).
   *
   * @param burst - Burst
   * @param count - Requested Particle Count
   * @param perShotOrigin - Sample Origin Once Flag
   */
  private readonly spawn = (burst: Burst, count: number, perShotOrigin: boolean): void => {
    const allowed = Math.min(count, this.maxParticles);

    if (allowed <= 0) {
      return;
    }

    this.makeRoom(allowed);
    Emitter.emit(burst, allowed, this.pool, this.surface, perShotOrigin);
  };

  /**
   * Handle Animation Frame.
   *
   * @param time - Frame Timestamp in Milliseconds
   */
  private readonly onFrame = (time: number): void => {
    this.frameId = null;

    const dt =
      this.lastTime === null
        ? Engine.FIRST_FRAME_SECONDS
        : Math.min(
            Math.max((time - this.lastTime) / Engine.MS_PER_SECOND, 0),
            Engine.MAX_DELTA_SECONDS,
          );

    this.lastTime = time;
    const hasActive = this.fixedTimestep ? this.stepFixed(dt) : this.step(dt);
    this.renderer.render(this.surface, this.bursts);

    if (hasActive) {
      this.requestFrame();
    } else {
      // everything paused or finished: idle until resume()/fire()
      this.lastTime = null;
      this.accumulator = 0;
    }
  };

  /**
   * Advance in Fixed 1/60 s Steps (the same seed then replays exactly on any display).
   *
   * @param dt - Real Frame Time in Seconds
   * @returns Active (Unpaused) Burst Exists Flag
   */
  private stepFixed(dt: number): boolean {
    const step = Engine.FIXED_STEP_SECONDS;
    let hasActive = this.hasActiveBurst();
    this.accumulator += dt;

    // a frame may run a step slightly early, so a jittery 60 Hz screen still gets one step per frame
    while (this.accumulator >= step - Engine.FIXED_STEP_TOLERANCE) {
      hasActive = this.step(step);
      this.accumulator -= step;
    }

    return hasActive;
  }

  /**
   * Check Whether Any Burst Is Running (not paused).
   *
   * @returns Running Burst Exists Flag
   */
  private hasActiveBurst(): boolean {
    for (const burst of this.bursts) {
      if (!burst.isPaused()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Advance All Bursts.
   *
   * @param dt - Time Step in Seconds
   * @returns Active (Unpaused) Burst Exists Flag
   */
  private step(dt: number): boolean {
    let hasActive = false;
    this.world.width = this.surface.getWidth();
    this.world.height = this.surface.getHeight();

    for (let index = this.bursts.length - 1; index >= 0; index--) {
      const burst = this.bursts[index];

      if (burst === undefined) {
        continue;
      }

      if (burst.isStopRequested()) {
        this.releaseAll(burst);
      } else if (!burst.isPaused()) {
        burst.advanceEmission(dt * Engine.MS_PER_SECOND, this.spawn);
        this.tickBurst(burst, dt);
        hasActive = true;
      }

      if (burst.isEmissionDone() && burst.getParticleCount() === 0) {
        burst.finish();
        this.bursts.splice(index, 1);
      }
    }

    return hasActive && this.bursts.length > 0;
  }

  /**
   * Advance Burst Particles and Recycle Dead Ones.
   *
   * @param burst - Burst
   * @param dt - Time Step in Seconds
   */
  private tickBurst(burst: Burst, dt: number): void {
    const particles = burst.getParticles();
    const pipeline = burst.getPipeline();
    const hooks = burst.getOptions().hooks;
    const floor = pipeline.hasFloor() ? Infinity : this.world.height + Engine.CULL_MARGIN;
    const dtMs = dt * Engine.MS_PER_SECOND;
    let write = 0;

    pipeline.beginFrame(this.world);

    // stable in-place compaction keeps spawn order (oldest first) for makeRoom()
    for (const particle of particles) {
      pipeline.step(particle, dt, this.world);
      TrailRecorder.record(particle);
      SpriteAnimator.advance(particle, dtMs);
      hooks.onParticleUpdate?.(particle, dt);

      if (Engine.isDead(particle, floor)) {
        hooks.onParticleDeath?.(particle);
        this.pool.release(particle);
      } else {
        particles[write++] = particle;
      }
    }

    particles.length = write;
  }

  /**
   * Remove Oldest Particles until Incoming Fit.
   *
   * @param incoming - Particles About to Spawn
   */
  private makeRoom(incoming: number): void {
    let excess = this.getParticleCount() + incoming - this.maxParticles;

    for (const burst of this.bursts) {
      if (excess <= 0) {
        break;
      }

      const particles = burst.getParticles();
      const removeCount = Math.min(excess, particles.length);
      const onDeath = burst.getOptions().hooks.onParticleDeath;

      // oldest particles sit at the front of each burst
      for (const particle of particles.splice(0, removeCount)) {
        onDeath?.(particle);
        this.pool.release(particle);
      }

      excess -= removeCount;
    }
  }

  /**
   * Check Particle Death.
   *
   * @param particle - Particle
   * @param floor - Cull Line in CSS Pixels
   * @returns Dead Flag
   */
  private static isDead(particle: Particle, floor: number): boolean {
    // a particle held in a formation may start off-canvas and has not begun its life yet
    if (particle.isForming) {
      return false;
    }

    return (
      particle.isExpired() ||
      (particle.vy > 0 && particle.y - Math.max(particle.width, particle.height) > floor)
    );
  }

  /**
   * Release Every Particle of Burst (no death hooks).
   *
   * @param burst - Burst
   */
  private releaseAll(burst: Burst): void {
    const particles = burst.getParticles();

    for (const particle of particles) {
      this.pool.release(particle);
    }

    particles.length = 0;
  }

  /**
   * Cancel Pending Frame.
   */
  private cancelFrame(): void {
    if (this.frameId !== null) {
      this.scheduler.cancel(this.frameId);
      this.frameId = null;
    }
  }
}
