import {
  FORMATION_EDGE_MARGIN,
  FORMATION_RELEASE_SPREAD,
  FORMATION_STAGGER,
} from "../../config/FormationDefaults";
import { DEFAULT_STYLE } from "../../config/PaperDefaults";
import { OriginLocator } from "../../core/OriginLocator";
import type { RenderSurface } from "../../core/RenderSurface";
import type { Particle } from "../../particles/Particle";
import type { PlacedOrigin } from "../../types/resolved/PlacedOrigin";
import type { ResolvedStyle } from "../../types/resolved/ResolvedStyle";
import { ColorUtils } from "../../utils/ColorUtils";
import { MathUtils } from "../../utils/MathUtils";
import type { Random } from "../../utils/Random";
import type { IFormation } from "../abstracts/IFormation";
import type { IFormationSource } from "../abstracts/IFormationSource";
import { FormationSampler } from "../FormationSampler";
import type { FormationSettings } from "../types/FormationSettings";

/**
 * One Burst's Formation.
 * Samples the shape for the canvas at the first emission, places every new particle (start, place in the
 * shape, burst-apart velocity, image color) and moves forming particles until they are released.
 */
export class Formation implements IFormation {
  /**
   * Milliseconds per Second.
   */
  private static readonly MS_PER_SECOND = 1000;

  /**
   * Where the Shape's Pixels Come From.
   */
  private readonly source: IFormationSource;

  /**
   * Resolved Settings.
   */
  private readonly settings: FormationSettings;

  /**
   * Target X Positions in CSS Pixels.
   */
  private targetX = new Float32Array(0);

  /**
   * Target Y Positions in CSS Pixels.
   */
  private targetY = new Float32Array(0);

  /**
   * Front Colors per Target (image colors only).
   */
  private frontColors: string[] | null = null;

  /**
   * Back Colors per Target (image colors only).
   */
  private backColors: string[] | null = null;

  /**
   * Prepared Target Count.
   */
  private count = 0;

  /**
   * Shape Center X in CSS Pixels.
   */
  private centerX = 0;

  /**
   * Shape Center Y in CSS Pixels.
   */
  private centerY = 0;

  /**
   * Fit Scale of the Whole Formation (shape, spacing and particle size).
   */
  private scale = 1;

  /**
   * Canvas Width at Preparation in CSS Pixels.
   */
  private canvasWidth = 0;

  /**
   * Canvas Height at Preparation in CSS Pixels.
   */
  private canvasHeight = 0;

  /**
   * Create Formation.
   *
   * @param source - Where the Shape's Pixels Come From
   * @param settings - Resolved Settings
   */
  public constructor(source: IFormationSource, settings: FormationSettings) {
    this.source = source;
    this.settings = settings;
  }

  /**
   * Check Whether the Shape Can Be Sampled.
   *
   * @returns Ready Flag
   */
  public isReady(): boolean {
    return this.source.isReady();
  }

  /**
   * Check Whether the Shape Failed to Load.
   *
   * @returns Failed Flag
   */
  public hasFailed(): boolean {
    return this.source.hasFailed();
  }

  /**
   * Sample the Target Points for the Current Canvas.
   *
   * @param surface - Drawing Surface
   * @param origin - Burst Origin (the center of the shape)
   * @param random - Burst Random Generator
   * @returns Number of Particles the Shape Needs
   */
  public prepare(surface: RenderSurface, origin: PlacedOrigin, random: Random): number {
    const mask = this.source.getMask();

    if (mask === null) {
      return 0;
    }

    const box = OriginLocator.box(origin, surface);
    const { spacing, fit, imageColors, limit } = this.settings;
    const shapeWidth = mask.width / mask.scale;
    const shapeHeight = mask.height / mask.scale;
    this.centerX = (box.x[0] + box.x[1]) / 2;
    this.centerY = (box.y[0] + box.y[1]) / 2;
    this.canvasWidth = surface.getWidth();
    this.canvasHeight = surface.getHeight();

    // shrink (never grow) the whole formation into the canvas: shape, spacing and particle size together, so a
    // phone shows a smaller copy of the same picture instead of letters too thin for the pieces
    const fitScale =
      this.canvasWidth > 0 && this.canvasHeight > 0
        ? Math.min(
            1,
            (this.canvasWidth * fit) / shapeWidth,
            (this.canvasHeight * fit) / shapeHeight,
          )
        : 1;
    const samples = FormationSampler.sample(mask, spacing * mask.scale, random, imageColors);
    const count = Math.min(samples.count, limit);
    const toCss = fitScale / mask.scale;
    this.scale = fitScale;

    this.targetX = new Float32Array(count);
    this.targetY = new Float32Array(count);

    for (let index = 0; index < count; index++) {
      this.targetX[index] = this.centerX + ((samples.x[index] ?? 0) - mask.width / 2) * toCss;
      this.targetY[index] = this.centerY + ((samples.y[index] ?? 0) - mask.height / 2) * toCss;
    }

    this.prepareColors(samples.rgb, count);
    this.count = count;
    return count;
  }

  /**
   * Return the Size Multiplier of the Particles.
   *
   * @returns Fit Scale (`1` when the shape fits as it is)
   */
  public getScale(): number {
    return this.scale;
  }

  /**
   * Place a Newly Spawned Particle.
   *
   * @param particle - Particle
   * @param index - Spawn Index within the Burst
   * @param random - Burst Random Generator
   * @param style - Resolved Style of the Particle's Shape
   */
  public place(particle: Particle, index: number, random: Random, style: ResolvedStyle): void {
    if (this.count === 0) {
      return;
    }

    const target = index % this.count;
    const toX = this.targetX[target] ?? this.centerX;
    const toY = this.targetY[target] ?? this.centerY;

    // burst apart straight outward from the center, at the launch speed the emitter already sampled
    const speed = Math.hypot(particle.vx, particle.vy);
    const dx = toX - this.centerX;
    const dy = toY - this.centerY;
    const outward = dx === 0 && dy === 0 ? random.next() * MathUtils.TAU : Math.atan2(dy, dx);
    const direction =
      outward + (random.next() - 0.5) * FORMATION_RELEASE_SPREAD * MathUtils.DEG_TO_RAD;
    particle.vx = Math.cos(direction) * speed;
    particle.vy = Math.sin(direction) * speed;

    particle.formationToX = toX;
    particle.formationToY = toY;

    if (this.settings.mode === "appear") {
      particle.formationFromX = toX;
      particle.formationFromY = toY;
      particle.formationDelay = 0;
    } else {
      this.placeOutside(particle, random);
      particle.formationDelay = random.next() * this.settings.assemble * FORMATION_STAGGER;
    }

    particle.x = particle.formationFromX;
    particle.y = particle.formationFromY;
    particle.formationElapsed = 0;
    particle.isForming = true;
    // the shape shows at full strength, and the sway starts from zero once the particle is released
    particle.fadeIn = 0;
    particle.wobblePhase = 0;

    const front = this.frontColors?.[target];

    if (front !== undefined) {
      particle.frontColor = front;
      particle.lifeColors = null;

      if (style.backPalette === null) {
        particle.backColor = this.backColors?.[target] ?? front;
      }
    }
  }

  /**
   * Move a Forming Particle.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   * @returns Still Forming Flag (`false` once the particle is released in this step)
   */
  public step(particle: Particle, dt: number): boolean {
    particle.formationElapsed += dt * Formation.MS_PER_SECOND;
    const elapsed = particle.formationElapsed;
    const { assemble, hold, easing } = this.settings;

    if (elapsed < assemble) {
      const delay = particle.formationDelay;
      const progress = elapsed <= delay ? 0 : (elapsed - delay) / (assemble - delay);
      const eased = easing(Math.min(progress, 1));
      particle.x = MathUtils.lerp(particle.formationFromX, particle.formationToX, eased);
      particle.y = MathUtils.lerp(particle.formationFromY, particle.formationToY, eased);
      return true;
    }

    particle.x = particle.formationToX;
    particle.y = particle.formationToY;

    if (elapsed < assemble + hold) {
      return true;
    }

    particle.isForming = false;
    return false;
  }

  /**
   * Start a Particle just beyond a Random Point of the Canvas Edges.
   *
   * @param particle - Particle
   * @param random - Burst Random Generator
   */
  private placeOutside(particle: Particle, random: Random): void {
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const margin = Math.max(width, height) * FORMATION_EDGE_MARGIN;
    const outerWidth = width + margin * 2;
    const outerHeight = height + margin * 2;
    // a uniform point on the outer rectangle's perimeter: top, right, bottom, left
    let along = random.next() * (outerWidth + outerHeight) * 2;

    if (along < outerWidth) {
      particle.formationFromX = along - margin;
      particle.formationFromY = -margin;
      return;
    }

    along -= outerWidth;

    if (along < outerHeight) {
      particle.formationFromX = width + margin;
      particle.formationFromY = along - margin;
      return;
    }

    along -= outerHeight;

    if (along < outerWidth) {
      particle.formationFromX = width + margin - along;
      particle.formationFromY = height + margin;
      return;
    }

    particle.formationFromX = -margin;
    particle.formationFromY = height + margin - (along - outerWidth);
  }

  /**
   * Turn Sampled Pixel Colors into Front and Back Colors.
   *
   * @param rgb - Colors as `r, g, b` Triples, or Null
   * @param count - Number of Targets in Use
   */
  private prepareColors(rgb: Uint8ClampedArray | null, count: number): void {
    if (rgb === null) {
      this.frontColors = null;
      this.backColors = null;
      return;
    }

    this.frontColors = [];
    this.backColors = [];

    for (let index = 0; index < count; index++) {
      const color = {
        r: rgb[index * 3] ?? 0,
        g: rgb[index * 3 + 1] ?? 0,
        b: rgb[index * 3 + 2] ?? 0,
        a: 1,
      };
      this.frontColors.push(ColorUtils.toCss(color));
      this.backColors.push(ColorUtils.toCss(ColorUtils.shade(color, DEFAULT_STYLE.backShade)));
    }
  }
}
