/**
 * One Frame of a Sprite Atlas JSON.
 * The shape TexturePacker, Aseprite, Free Texture Packer and Phaser write: the frame's rectangle in the sheet, and
 * flags for frames the packer rotated or trimmed.
 */
export type SpriteAtlasFrame = {
  /**
   * Frame Rectangle in the Sheet (source pixels).
   */
  readonly frame: {
    /**
     * Left Edge.
     */
    readonly x: number;
    /**
     * Top Edge.
     */
    readonly y: number;
    /**
     * Width.
     */
    readonly w: number;
    /**
     * Height.
     */
    readonly h: number;
  };
  /**
   * Frame Name (the "JSON Array" layout; the "JSON Hash" layout keys frames by name instead).
   */
  readonly filename?: string;
  /**
   * Rotated by the Packer (not supported: export the sheet without rotation).
   */
  readonly rotated?: boolean;
  /**
   * Trimmed by the Packer (frames of different sizes are each stretched to the particle size).
   */
  readonly trimmed?: boolean;
};
