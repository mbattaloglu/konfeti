import { FORMATION_MAX_MASK_PIXELS } from "../../config/FormationDefaults";
import { CanvasFactory } from "../../utils/CanvasFactory";
import type { ImageSource } from "../../utils/ImageSource";
import type { IFormationSource } from "../abstracts/IFormationSource";
import type { FormationMask } from "../types/FormationMask";

/**
 * Image Formation Source.
 * Draws the loaded image at its formation width into a scratch canvas and reads the pixels back once.
 */
export class ImageFormationSource implements IFormationSource {
  /**
   * Image to Trace.
   */
  private readonly image: ImageSource;

  /**
   * Width on Screen in CSS Pixels, or Null for the Image's Own Width.
   */
  private readonly width: number | null;

  /**
   * Read Mask (after the first successful `getMask()`).
   */
  private mask: FormationMask | null = null;

  /**
   * Read Failure Flag (no canvas, or a tainted cross-origin image).
   */
  private _hasFailed = false;

  /**
   * Create Source.
   *
   * @param image - Image to Trace
   * @param width - Width on Screen in CSS Pixels, or Null for the Image's Own Width
   */
  public constructor(image: ImageSource, width: number | null) {
    this.image = image;
    this.width = width;
  }

  /**
   * Check Whether the Image Has Loaded.
   *
   * @returns Ready Flag
   */
  public isReady(): boolean {
    return this.image.isReady();
  }

  /**
   * Check Whether the Image Failed to Load or to Be Read.
   *
   * @returns Failed Flag
   */
  public hasFailed(): boolean {
    return this._hasFailed || this.image.hasFailed();
  }

  /**
   * Return the Image's Pixels (read on the first call after loading).
   *
   * @returns Mask, or Null when the Pixels Cannot Be Read
   */
  public getMask(): FormationMask | null {
    if (this.mask === null && !this._hasFailed && this.image.isReady()) {
      this.mask = this.read();
    }

    return this.mask;
  }

  /**
   * Draw the Image into a Canvas and Read Its Pixels.
   *
   * @returns Mask, or Null when Reading Fails
   */
  private read(): FormationMask | null {
    const naturalWidth = this.image.getWidth();
    const naturalHeight = this.image.getHeight();
    const cssWidth = this.width ?? naturalWidth;
    const cssHeight = (cssWidth * naturalHeight) / naturalWidth;
    // a large image is read at a lower resolution; the mask scale maps it back
    const scale = Math.min(1, Math.sqrt(FORMATION_MAX_MASK_PIXELS / (cssWidth * cssHeight)));
    const width = Math.max(1, Math.round(cssWidth * scale));
    const height = Math.max(1, Math.round(cssHeight * scale));
    const scratch = CanvasFactory.create(width, height);

    if (scratch === null) {
      this._hasFailed = true;
      return null;
    }

    try {
      scratch.context.drawImage(this.image.getImage(), 0, 0, width, height);
      const image = scratch.context.getImageData(0, 0, width, height);
      return { width, height, data: image.data, scale };
    } catch {
      // a cross-origin image without CORS headers taints the canvas: its pixels cannot be read
      this._hasFailed = true;
      return null;
    }
  }
}
