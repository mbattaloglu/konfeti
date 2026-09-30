import { TRAIL_LENGTH_LIMITS } from "../config/PaperDefaults";
import type { Particle } from "../particles/Particle";
import type { OriginBox } from "../types/resolved/OriginBox";
import type { ResolvedFireOptions } from "../types/resolved/ResolvedFireOptions";
import type { ResolvedPalette } from "../types/resolved/ResolvedPalette";
import type { ResolvedStyle } from "../types/resolved/ResolvedStyle";
import { MathUtils } from "../utils/MathUtils";
import type { Random } from "../utils/Random";
import { RangeUtils } from "../utils/RangeUtils";
import { OriginLocator } from "./OriginLocator";
import { WeightedListUtils } from "../utils/WeightedListUtils";
import type { Burst } from "./Burst";
import type { RenderSurface } from "./RenderSurface";
import type { ParticlePool } from "./ParticlePool";

/**
 * Pixel-Space Origin Box.
 */

/**
 * Static Particle Spawner.
 * Samples every per-particle value from resolved options; all randomness comes from the burst's seeded RNG.
 */
export class Emitter {
  /**
   * Emit Particles into Burst.
   *
   * @param burst - Target Burst
   * @param count - Number of Particles to Spawn
   * @param pool - Particle Pool
   * @param surface - Canvas Surface (origin mapping, gradient creation)
   * @param perShotOrigin - Sample the Origin Once for All Particles Flag
   */
  public static emit(
    burst: Burst,
    count: number,
    pool: ParticlePool,
    surface: RenderSurface,
    perShotOrigin: boolean,
  ): void {
    const options = burst.getOptions();
    const random = burst.getRandom();
    const context = surface.getContext();
    const box = Emitter.resolveOriginBox(options, surface);

    // a tracked origin without a place (pointer not seen yet): nothing to emit this time
    if (box === null) {
      return;
    }

    let origin = box;

    if (perShotOrigin) {
      const x = RangeUtils.sample(origin.x, random);
      const y = RangeUtils.sample(origin.y, random);
      origin = { x: [x, x], y: [y, y] };
    }

    for (let index = 0; index < count; index++) {
      const particle = pool.acquire();
      const shape = WeightedListUtils.pick(options.shapes, random);
      const scale = Math.max(0, RangeUtils.sample(shape.style.scale, random));
      const colorIndex = Emitter.pickColorIndex(
        shape.style.palette,
        random,
        burst.nextSequenceIndex(),
      );

      Emitter.spawnMotion(particle, options, random, origin);
      Emitter.spawnStyle(particle, shape.style, random, scale, colorIndex);

      shape.spawn(particle, random, scale, colorIndex);

      const gradient = shape.style.gradient;

      if (gradient !== null) {
        particle.gradient =
          particle.shape?.createGradient(context, particle, gradient.colors, gradient.angle) ??
          null;
      }

      burst.add(particle);
    }
  }

  /**
   * Resolve Origin into Pixel Ranges.
   *
   * @param options - Resolved Burst Options
   * @param surface - Canvas Surface
   * @returns Horizontal and Vertical Pixel Ranges, or Null when a Tracked Origin Has No Place Yet
   */
  private static resolveOriginBox(
    options: ResolvedFireOptions,
    surface: RenderSurface,
  ): OriginBox | null {
    const origin =
      options.origin.kind === "tracked" ? options.origin.tracker.getOrigin() : options.origin;

    if (origin === null) {
      return null;
    }

    return OriginLocator.box(origin, surface);
  }

  /**
   * Spawn Position, Velocity, Physics and Lifetime.
   *
   * @param particle - Target Particle
   * @param options - Resolved Burst Options
   * @param random - Burst Random Generator
   * @param origin - Origin Pixel Ranges
   */
  private static spawnMotion(
    particle: Particle,
    options: ResolvedFireOptions,
    random: Random,
    origin: OriginBox,
  ): void {
    const direction =
      (RangeUtils.sample(options.angle, random) + (random.next() - 0.5) * options.spread) *
      MathUtils.DEG_TO_RAD;
    const speed = RangeUtils.sample(options.startVelocity, random);
    const physics = options.physics;

    particle.x = RangeUtils.sample(origin.x, random);
    particle.y = RangeUtils.sample(origin.y, random);
    // canvas y grows downward, so "up" is negative
    particle.vx = Math.cos(direction) * speed;
    particle.vy = -Math.sin(direction) * speed;
    particle.gravity = RangeUtils.sample(physics.gravity, random);
    particle.drag = Math.max(0, RangeUtils.sample(physics.drag, random));
    particle.wind = RangeUtils.sample(physics.wind, random);
    particle.lifetime = Math.max(0, RangeUtils.sample(options.lifetime, random));
    particle.age = 0;

    particle.attractStrength =
      physics.attract === null ? 0 : RangeUtils.sample(physics.attract.strength, random);

    if (physics.swirl !== null) {
      particle.swirlStrength = RangeUtils.sample(physics.swirl.strength, random);
      particle.swirlSpeed = RangeUtils.sample(physics.swirl.frequency, random) * MathUtils.TAU;
      particle.swirlPhase = random.next() * MathUtils.TAU;
    }
  }

  /**
   * Spawn Common Style.
   *
   * @param particle - Target Particle
   * @param style - Resolved Style
   * @param random - Burst Random Generator
   * @param scale - Sampled Size Multiplier
   * @param colorIndex - Picked Front Color Index
   */
  private static spawnStyle(
    particle: Particle,
    style: ResolvedStyle,
    random: Random,
    scale: number,
    colorIndex: number,
  ): void {
    const palette = style.palette;

    particle.frontColor = palette.colors[colorIndex] ?? "";
    particle.backColor =
      style.backPalette === null
        ? (palette.shadedColors[colorIndex] ?? particle.frontColor)
        : (style.backPalette.colors[WeightedListUtils.pickIndex(style.backPalette, random)] ??
          particle.frontColor);
    particle.lifeColors = style.colorOverLife?.tables[colorIndex] ?? null;
    particle.lifeColorEasing = style.colorOverLife?.easing ?? null;

    particle.strokeColor = style.stroke?.color ?? null;
    particle.strokeWidth =
      style.stroke === null
        ? 0
        : Math.max(0, RangeUtils.sample(style.stroke.width, random)) * scale;
    particle.opacity = RangeUtils.sample(style.opacity, random);
    particle.fadeIn = style.fadeIn;
    particle.fadeStart = style.fadeOut?.start ?? 1;
    particle.fadeEasing = style.fadeOut?.easing ?? null;
    particle.scaleEnd = style.scaleOverLife?.to ?? 1;
    particle.scaleEasing = style.scaleOverLife?.easing ?? null;

    particle.rotation = RangeUtils.sample(style.rotation, random) * MathUtils.DEG_TO_RAD;
    particle.rotationSpeed = RangeUtils.sample(style.rotationSpeed, random) * MathUtils.DEG_TO_RAD;
    particle.flipAxis = style.flip?.axis ?? null;
    particle.flipPhase = random.next() * MathUtils.TAU;
    particle.flipSpeed =
      style.flip === null ? 0 : RangeUtils.sample(style.flip.frequency, random) * MathUtils.TAU;
    particle.wobblePhase = random.next() * MathUtils.TAU;
    particle.wobbleAmplitude =
      style.wobble === null ? 0 : RangeUtils.sample(style.wobble.amplitude, random);
    particle.wobbleSpeed =
      style.wobble === null ? 0 : RangeUtils.sample(style.wobble.frequency, random) * MathUtils.TAU;
    particle.tilt = Math.tan(RangeUtils.sample(style.tilt, random) * MathUtils.DEG_TO_RAD);

    particle.shadowColor = style.shadow?.color ?? null;
    particle.shadowBlur = style.shadow?.blur ?? 0;
    particle.shadowOffsetX = style.shadow?.offsetX ?? 0;
    particle.shadowOffsetY = style.shadow?.offsetY ?? 0;
    particle.shine = style.shine;
    particle.blendMode = style.blendMode;

    if (style.trail !== null) {
      // the buffers are sized for the longest trail, so a reused particle never reallocates
      particle.trailX ??= new Float32Array(TRAIL_LENGTH_LIMITS[1]);
      particle.trailY ??= new Float32Array(TRAIL_LENGTH_LIMITS[1]);
      particle.trailLength = style.trail.length;
      particle.trailWidth = Math.max(0, RangeUtils.sample(style.trail.width, random)) * scale;
      particle.trailOpacity = style.trail.opacity;
      particle.trailColor = style.trail.color;
    }
  }

  /**
   * Pick Palette Color Index.
   *
   * @param palette - Resolved Palette
   * @param random - Burst Random Generator
   * @param sequence - Monotonic Particle Index
   * @returns Color Index
   */
  private static pickColorIndex(
    palette: ResolvedPalette,
    random: Random,
    sequence: number,
  ): number {
    return palette.mode === "sequence"
      ? sequence % palette.colors.length
      : WeightedListUtils.pickIndex(palette, random);
  }
}
