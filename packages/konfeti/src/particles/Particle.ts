import type { EasingFunction } from "../types/Easing";
import type { FlipAxis } from "../types/FlipAxis";
import type { PaperForm } from "../types/PaperForm";
import type { ResolvedCustomShape, ResolvedFrames } from "../types/resolved/ResolvedShape";
import type { IShape } from "../shapes/abstracts/IShape";
import type { ImageSource } from "../utils/ImageSource";

/**
 * Pooled Particle State.
 * A hot-path data record: fields are public and mutable on purpose (no accessor overhead in the frame loop).
 * Angles are radians, positions CSS pixels, times milliseconds.
 */
export class Particle {
  /**
   * Horizontal Position.
   */
  public x = 0;
  /**
   * Vertical Position.
   */
  public y = 0;
  /**
   * Horizontal Velocity (px/s).
   */
  public vx = 0;
  /**
   * Vertical Velocity (px/s).
   */
  public vy = 0;
  /**
   * Gravity Acceleration (px/s²).
   */
  public gravity = 0;
  /**
   * Drag Rate (1/s).
   */
  public drag = 0;
  /**
   * Wind Acceleration (px/s²).
   */
  public wind = 0;
  /**
   * Swirl Phase.
   */
  public swirlPhase = 0;
  /**
   * Swirl Speed (rad/s).
   */
  public swirlSpeed = 0;
  /**
   * Swirl Strength (px/s²).
   */
  public swirlStrength = 0;
  /**
   * Attractor Pull (px/s², negative pushes away).
   */
  public attractStrength = 0;
  /**
   * Resting on Floor Flag.
   */
  public isResting = false;
  /**
   * Current Age.
   */
  public age = 0;
  /**
   * Total Lifetime.
   */
  public lifetime = 0;
  /**
   * 2D Rotation.
   */
  public rotation = 0;
  /**
   * Rotation Speed (rad/s).
   */
  public rotationSpeed = 0;
  /**
   * Width.
   */
  public width = 0;
  /**
   * Height (`0` for bitmaps whose image is still loading).
   */
  public height = 0;
  /**
   * Horizontal Skew Tangent.
   */
  public skewTan = 0;
  /**
   * Tilt Amplitude (skew tangent).
   */
  public tilt = 0;
  /**
   * Corner Radius List in `tl, tr, br, bl` Order (reused, never reallocated).
   */
  public readonly radii: [number, number, number, number] = [0, 0, 0, 0];
  /**
   * Rounded Corners Flag.
   */
  public isRounded = false;
  /**
   * Paper Silhouette.
   */
  public form: PaperForm = "rect";
  /**
   * Front Side Color.
   */
  public frontColor = "";
  /**
   * Back Side Color.
   */
  public backColor = "";
  /**
   * Gradient Front Fill (`null` uses `frontColor`).
   */
  public gradient: CanvasGradient | null = null;
  /**
   * Color-over-Life Lookup Table (`null` disables it).
   */
  public lifeColors: readonly string[] | null = null;
  /**
   * Color-over-Life Easing.
   */
  public lifeColorEasing: EasingFunction | null = null;
  /**
   * Stroke Color (`null` disables stroke).
   */
  public strokeColor: string | null = null;
  /**
   * Stroke Width.
   */
  public strokeWidth = 0;
  /**
   * Base Opacity.
   */
  public opacity = 1;
  /**
   * Fade-In Fraction.
   */
  public fadeIn = 0;
  /**
   * Fade Start as Lifetime Fraction.
   */
  public fadeStart = 1;
  /**
   * Fade Easing (`null` disables fading).
   */
  public fadeEasing: EasingFunction | null = null;
  /**
   * End Scale Multiplier.
   */
  public scaleEnd = 1;
  /**
   * Scale-over-Life Easing (`null` disables it).
   */
  public scaleEasing: EasingFunction | null = null;
  /**
   * Flip Axis (`null` disables flip).
   */
  public flipAxis: FlipAxis | null = null;
  /**
   * Flip Phase.
   */
  public flipPhase = 0;
  /**
   * Flip Speed (rad/s).
   */
  public flipSpeed = 0;
  /**
   * Wobble Phase.
   */
  public wobblePhase = 0;
  /**
   * Wobble Speed (rad/s).
   */
  public wobbleSpeed = 0;
  /**
   * Wobble Amplitude.
   */
  public wobbleAmplitude = 0;
  /**
   * Shadow Color (`null` disables shadow).
   */
  public shadowColor: string | null = null;
  /**
   * Shadow Blur.
   */
  public shadowBlur = 0;
  /**
   * Shadow Horizontal Offset.
   */
  public shadowOffsetX = 0;
  /**
   * Shadow Vertical Offset.
   */
  public shadowOffsetY = 0;
  /**
   * Shine Strength.
   */
  public shine = 0;
  /**
   * Canvas Blend Mode.
   */
  public blendMode: GlobalCompositeOperation = "source-over";
  /**
   * Trail X Positions (ring buffer, allocated once per particle and reused through the pool).
   */
  public trailX: Float32Array | null = null;
  /**
   * Trail Y Positions (ring buffer).
   */
  public trailY: Float32Array | null = null;
  /**
   * Next Ring Slot to Write.
   */
  public trailHead = 0;
  /**
   * Recorded Trail Points (up to trailLength).
   */
  public trailCount = 0;
  /**
   * Trail Length in Points (`0` = no trail).
   */
  public trailLength = 0;
  /**
   * Trail Head Width in Pixels.
   */
  public trailWidth = 0;
  /**
   * Trail Head Opacity.
   */
  public trailOpacity = 0;
  /**
   * Trail Color (`null` = front color).
   */
  public trailColor: string | null = null;
  /**
   * Vector Path (vector shapes).
   */
  public path: Path2D | null = null;
  /**
   * Path-to-Unit Scale.
   */
  public pathScale = 1;
  /**
   * Path Horizontal Offset.
   */
  public pathOffsetX = 0;
  /**
   * Path Vertical Offset.
   */
  public pathOffsetY = 0;
  /**
   * Bitmap Source (bitmap and sprite shapes).
   */
  public image: ImageSource | null = null;
  /**
   * Sprite Frame Layout.
   */
  public frames: ResolvedFrames | null = null;
  /**
   * Sprite Frame Count.
   */
  public frameCount = 0;
  /**
   * Current Sprite Frame.
   */
  public frameIndex = 0;
  /**
   * Time Accumulated in Current Frame.
   */
  public frameElapsed = 0;
  /**
   * Frame Duration (`0` freezes the animation).
   */
  public frameDuration = 0;
  /**
   * Loop Sprite Animation Flag.
   */
  public frameLoop = true;
  /**
   * Draw-Based Custom Shape (`null` for built-in shapes).
   */
  public custom: ResolvedCustomShape | null = null;
  /**
   * Shape Renderer (`null` until spawned).
   */
  public shape: IShape | null = null;
  /**
   * Held in a Formation Flag (moved by the formation, not by physics, until released).
   */
  public isForming = false;
  /**
   * Formation Start X (where the fly-in begins).
   */
  public formationFromX = 0;
  /**
   * Formation Start Y.
   */
  public formationFromY = 0;
  /**
   * Formation Target X (the particle's place in the shape).
   */
  public formationToX = 0;
  /**
   * Formation Target Y.
   */
  public formationToY = 0;
  /**
   * Formation Start Delay in Milliseconds.
   */
  public formationDelay = 0;
  /**
   * Time Spent in the Formation in Milliseconds.
   */
  public formationElapsed = 0;

  /**
   * Reset Particle to Neutral State.
   * Called when the particle returns to the pool so stale references can be collected.
   */
  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0;
    this.drag = 0;
    this.wind = 0;
    this.swirlPhase = 0;
    this.swirlSpeed = 0;
    this.swirlStrength = 0;
    this.attractStrength = 0;
    this.isResting = false;
    this.age = 0;
    this.lifetime = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.width = 0;
    this.height = 0;
    this.skewTan = 0;
    this.tilt = 0;
    this.radii.fill(0);
    this.isRounded = false;
    this.form = "rect";
    this.frontColor = "";
    this.backColor = "";
    this.gradient = null;
    this.lifeColors = null;
    this.lifeColorEasing = null;
    this.strokeColor = null;
    this.strokeWidth = 0;
    this.opacity = 1;
    this.fadeIn = 0;
    this.fadeStart = 1;
    this.fadeEasing = null;
    this.scaleEnd = 1;
    this.scaleEasing = null;
    this.flipAxis = null;
    this.flipPhase = 0;
    this.flipSpeed = 0;
    this.wobblePhase = 0;
    this.wobbleSpeed = 0;
    this.wobbleAmplitude = 0;
    this.shadowColor = null;
    this.shadowBlur = 0;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    this.trailHead = 0;
    this.trailCount = 0;
    this.trailLength = 0;
    this.trailColor = null;
    this.shine = 0;
    this.blendMode = "source-over";
    this.path = null;
    this.pathScale = 1;
    this.pathOffsetX = 0;
    this.pathOffsetY = 0;
    this.image = null;
    this.frames = null;
    this.frameCount = 0;
    this.frameIndex = 0;
    this.frameElapsed = 0;
    this.frameDuration = 0;
    this.frameLoop = true;
    this.custom = null;
    this.shape = null;
    this.isForming = false;
    this.formationFromX = 0;
    this.formationFromY = 0;
    this.formationToX = 0;
    this.formationToY = 0;
    this.formationDelay = 0;
    this.formationElapsed = 0;
  }

  /**
   * Check Lifetime Expiry.
   *
   * @returns Expired Flag
   */
  public isExpired(): boolean {
    return this.age >= this.lifetime;
  }

  /**
   * Return the Drawn X Position (physics position plus the wobble sway).
   * Shapes and trails both use it, so a trail always ends at the particle it belongs to.
   *
   * @returns X in Canvas Pixels
   */
  public getDrawX(): number {
    return this.x + this.wobbleAmplitude * Math.sin(this.wobblePhase);
  }

  /**
   * Return Life Progress.
   *
   * @returns Progress (0–1)
   */
  public getProgress(): number {
    return this.lifetime > 0 ? Math.min(this.age / this.lifetime, 1) : 1;
  }
}
