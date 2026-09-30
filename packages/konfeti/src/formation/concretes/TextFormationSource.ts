import { FORMATION_MAX_MASK_PIXELS, FORMATION_TEXT_PADDING } from "../../config/FormationDefaults";
import { CanvasFactory } from "../../utils/CanvasFactory";
import type { IFormationSource } from "../abstracts/IFormationSource";
import type { FormationMask } from "../types/FormationMask";

/**
 * Text Formation Source.
 * Renders the text (centered lines) into a scratch canvas once and reads its pixels back. A web font that is
 * still loading is waited for, so the letters are sampled in the right font.
 */
export class TextFormationSource implements IFormationSource {
  /**
   * Text Lines.
   */
  private readonly lines: readonly string[];

  /**
   * CSS Font Shorthand.
   */
  private readonly font: string;

  /**
   * Rendered Mask (after the first `getMask()`).
   */
  private mask: FormationMask | null = null;

  /**
   * Ready Flag (false while a web font loads).
   */
  private _isReady = true;

  /**
   * Failed Flag (no canvas to render into).
   */
  private _hasFailed = false;

  /**
   * Create Source.
   *
   * @param text - Text (`\n` separates lines)
   * @param font - CSS Font Shorthand
   */
  public constructor(text: string, font: string) {
    this.lines = text.split("\n");
    this.font = font;
    this.waitForFont(text);
  }

  /**
   * Check Whether the Text Can Be Rendered.
   *
   * @returns Ready Flag
   */
  public isReady(): boolean {
    return this._isReady;
  }

  /**
   * Check Whether Rendering Failed.
   *
   * @returns Failed Flag
   */
  public hasFailed(): boolean {
    return this._hasFailed;
  }

  /**
   * Return the Text's Pixels (rendered on the first call).
   *
   * @returns Mask, or Null without a Canvas Implementation
   */
  public getMask(): FormationMask | null {
    if (this.mask === null && !this._hasFailed) {
      this.mask = this.render();
    }

    return this.mask;
  }

  /**
   * Hold the Source Back until a Loading Web Font Has Arrived.
   * System fonts and loaded fonts pass `check()` at once; without `document.fonts` (workers) the text is
   * rendered with whatever fonts are available.
   *
   * @param text - Text to Check the Font Against
   */
  private waitForFont(text: string): void {
    if (typeof document === "undefined" || !("fonts" in document)) {
      return;
    }

    try {
      if (document.fonts.check(this.font, text)) {
        return;
      }
    } catch {
      // an unparsable font string: the canvas falls back to its default font
      return;
    }

    this._isReady = false;
    const ready = (): void => {
      this._isReady = true;
    };
    document.fonts.load(this.font, text).then(ready, ready);
  }

  /**
   * Render the Lines into a Canvas and Read the Pixels Back.
   *
   * @returns Mask, or Null without a Canvas Implementation
   */
  private render(): FormationMask | null {
    const scratch = CanvasFactory.create(1, 1);

    if (scratch === null) {
      this._hasFailed = true;
      return null;
    }

    const { canvas, context } = scratch;
    context.font = this.font;
    const metrics = this.lines.map((line) => context.measureText(line));
    const lefts = metrics.map((metric) => TextFormationSource.finite(metric.actualBoundingBoxLeft));
    const widths = metrics.map(
      (metric, index) =>
        (lefts[index] ?? 0) +
        TextFormationSource.finite(metric.actualBoundingBoxRight || metric.width),
    );
    // font-level metrics give every line the same height, whatever letters it has
    const ascent = Math.max(
      0,
      ...metrics.map((metric) =>
        TextFormationSource.finite(metric.fontBoundingBoxAscent || metric.actualBoundingBoxAscent),
      ),
    );
    const descent = Math.max(
      0,
      ...metrics.map((metric) =>
        TextFormationSource.finite(
          metric.fontBoundingBoxDescent || metric.actualBoundingBoxDescent,
        ),
      ),
    );
    const lineHeight = Math.max(1, ascent + descent);
    const padding = FORMATION_TEXT_PADDING;
    const textWidth = Math.max(1, ...widths);
    const cssWidth = textWidth + padding * 2;
    const cssHeight = lineHeight * this.lines.length + padding * 2;
    // very large text is read at a lower resolution; the mask scale maps it back
    const scale = Math.min(1, Math.sqrt(FORMATION_MAX_MASK_PIXELS / (cssWidth * cssHeight)));

    canvas.width = Math.max(1, Math.ceil(cssWidth * scale));
    canvas.height = Math.max(1, Math.ceil(cssHeight * scale));

    // resizing resets the context state, so configure it afterwards
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.font = this.font;
    context.fillStyle = "#000";
    context.textBaseline = "alphabetic";

    this.lines.forEach((line, index) => {
      context.fillText(
        line,
        padding + (textWidth - (widths[index] ?? 0)) / 2 + (lefts[index] ?? 0),
        padding + ascent + index * lineHeight,
      );
    });

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height, data: image.data, scale };
  }

  /**
   * Return a Text Metric, or 0 when the Browser Did Not Provide It.
   *
   * @param value - Measured Metric
   * @returns Finite Metric
   */
  private static finite(value: number | undefined): number {
    return value !== undefined && Number.isFinite(value) ? value : 0;
  }
}
