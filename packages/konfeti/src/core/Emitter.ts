import type { Particle } from "../particles/Particle";
import type { RangeTuple } from "../types/Range";
import type { ResolvedFireOptions } from "../types/resolved/ResolvedFireOptions";
import type { ResolvedPalette } from "../types/resolved/ResolvedPalette";
import type { ResolvedStyle } from "../types/resolved/ResolvedStyle";
import { MathUtils } from "../utils/MathUtils";
import type { Random } from "../utils/Random";
import { RangeUtils } from "../utils/RangeUtils";
import { WeightedListUtils } from "../utils/WeightedListUtils";
import type { Burst } from "./Burst";
import type { CanvasSurface } from "./CanvasSurface";
import type { ParticlePool } from "./ParticlePool";

/**
 * Pixel-Space Origin Box.
 */
type OriginBox = { readonly x: RangeTuple; readonly y: RangeTuple };

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
    surface: CanvasSurface,
    perShotOrigin: boolean,
  ): void {
    const options = burst.getOptions();
    const random = burst.getRandom();
    const context = surface.getContext();
    let origin = Emitter.resolveOriginBox(options, surface);

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
   * @returns Horizontal and Vertical Pixel Ranges
   */
  private static resolveOriginBox(options: ResolvedFireOptions, surface: CanvasSurface): OriginBox {
    const origin = options.origin;

    switch (origin.kind) {
      case "element": {
        const center = surface.getElementCenter(origin.element);
        return { x: [center.x, center.x], y: [center.y, center.y] };
      }
      case "client": {
        const point = surface.clientToLocal(origin.clientX, origin.clientY);
        return { x: [point.x, point.x], y: [point.y, point.y] };
      }
      case "point": {
        const width = surface.getWidth();
        const height = surface.getHeight();
        return {
          x: [origin.x[0] * width, origin.x[1] * width],
          y: [origin.y[0] * height, origin.y[1] * height],
        };
      }
    }
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
