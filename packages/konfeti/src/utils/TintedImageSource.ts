import type { TintMode } from "../types/TintMode";
import { CanvasFactory } from "./CanvasFactory";
import { ImageSource } from "./ImageSource";

/**
 * Image Source that Draws Another Source Painted in One Color.
 * The copy is painted the first time it is drawn after the base image has loaded (again if the base swaps its image),
 * and shared by every tinted source with the same base image, color, mode and size.
 */
export class TintedImageSource extends ImageSource {
  /**
   * Painted Copies by Base Image, Then by Mode, Color and Size.
   */
  private static readonly painted = new WeakMap<object, Map<string, CanvasImageSource>>();

  /**
   * Placeholder Image (the size comes from the base source).
   */
  private static readonly EMPTY = { width: 0, height: 0 } as unknown as CanvasImageSource;

  /**
   * Source Being Tinted.
   */
  private readonly base: ImageSource;

  /**
   * Tint Color (any canvas color string).
   */
  private readonly color: string;

  /**
   * Tint Mode.
   */
  private readonly mode: TintMode;

  /**
   * Longest Side of the Copy in Pixels (0 keeps the image's own size).
   */
  private readonly maxSide: number;

  /**
   * Painted Copy, or Null Before the First Draw.
   */
  private copy: CanvasImageSource | null = null;

  /**
   * Base Image the Copy Was Painted From.
   */
  private paintedFrom: CanvasImageSource | null = null;

  /**
   * Create Tinted Source.
   *
   * @param base - Source to Tint
   * @param color - Tint Color
   * @param mode - Tint Mode
   * @param maxSide - Longest Side of the Copy (0 keeps the image's own size, needed for spritesheet frames)
   */
  public constructor(base: ImageSource, color: string, mode: TintMode, maxSide = 0) {
    super(TintedImageSource.EMPTY);
    this.base = base;
    this.color = color;
    this.mode = mode;
    this.maxSide = maxSide;
  }

  /**
   * Return the Painted Copy (painted now if the base has loaded since the last call).
   *
   * @returns Drawable Image
   */
  public override getImage(): CanvasImageSource {
    const source = this.base.getImage();

    if (!this.base.isReady()) {
      return source;
    }

    if (this.copy === null || this.paintedFrom !== source) {
      this.copy = TintedImageSource.paint(
        source,
        this.base.getWidth(),
        this.base.getHeight(),
        this.color,
        this.mode,
        this.maxSide,
      );
      this.paintedFrom = source;
    }

    return this.copy;
  }

  /**
   * Return Width of the Base Image (the copy keeps its aspect ratio).
   *
   * @returns Width in Pixels
   */
  public override getWidth(): number {
    return this.base.getWidth();
  }

  /**
   * Return Height of the Base Image.
   *
   * @returns Height in Pixels
   */
  public override getHeight(): number {
    return this.base.getHeight();
  }

  /**
   * Check Whether the Base Failed to Load.
   *
   * @returns Failed Flag
   */
  public override hasFailed(): boolean {
    return this.base.hasFailed();
  }

  /**
   * Paint a Copy of an Image in One Color, or Reuse a Copy Painted Before.
   *
   * @param source - Base Image
   * @param width - Base Width
   * @param height - Base Height
   * @param color - Tint Color
   * @param mode - Tint Mode
   * @param maxSide - Longest Side of the Copy (0 keeps the image's own size)
   * @returns Painted Copy (the base image itself where no canvas is available)
   */
  private static paint(
    source: CanvasImageSource,
    width: number,
    height: number,
    color: string,
    mode: TintMode,
    maxSide: number,
  ): CanvasImageSource {
    const scale = maxSide > 0 ? Math.min(1, maxSide / Math.max(width, height)) : 1;
    const copyWidth = Math.max(1, Math.round(width * scale));
    const copyHeight = Math.max(1, Math.round(height * scale));
    const key = `${mode}\u0000${color}\u0000${String(copyWidth)}x${String(copyHeight)}`;
    let copies = TintedImageSource.painted.get(source);

    if (copies === undefined) {
      copies = new Map();
      TintedImageSource.painted.set(source, copies);
    }

    const cached = copies.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const scratch = CanvasFactory.create(copyWidth, copyHeight);

    if (scratch === null) {
      return source;
    }

    const { canvas, context } = scratch;
    context.drawImage(source, 0, 0, copyWidth, copyHeight);
    context.fillStyle = color;

    if (mode === "fill") {
      // the color where the image has pixels, nothing elsewhere
      context.globalCompositeOperation = "source-in";
      context.fillRect(0, 0, copyWidth, copyHeight);
    } else {
      // multiplying also colors the transparent area, so the image's own alpha is put back afterwards
      context.globalCompositeOperation = "multiply";
      context.fillRect(0, 0, copyWidth, copyHeight);
      context.globalCompositeOperation = "destination-in";
      context.drawImage(source, 0, 0, copyWidth, copyHeight);
    }

    copies.set(key, canvas);

    return canvas;
  }
}
