/**
 * Default Vector Shape Settings.
 */
export const VECTOR_DEFAULTS = {
  starSize: [10, 16],
  starPoints: 5,
  starInnerRatio: 0.5,
  triangleSize: [8, 14],
  polygonSize: [8, 14],
  polygonSides: 6,
  heartSize: [10, 16],
  ribbonLength: [18, 30],
  ribbonThickness: 0.14,
  ribbonWaves: 2,
  pathSize: [12, 18],
  pathViewBox: [24, 24],
  minSides: 3,
  maxSides: 12,
  maxRibbonWaves: 8,
} as const;

/**
 * Default Bitmap Shape Settings.
 */
export const BITMAP_DEFAULTS = {
  emojiSize: [18, 28],
  emojiFontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
  textSize: [14, 22],
  textFontFamily: "system-ui, sans-serif",
  textFontWeight: 700,
  imageSize: [16, 28],
  spriteSize: [16, 28],
  spriteFps: 12,
  spriteLoop: true,
  spriteRandomStartFrame: true,
  // image and spritesheet tint: off; `true` means this mode
  tint: false,
  tintMode: "multiply",
  // bitmaps are rasterized once at this multiple of the largest drawn size for crisp downscaling
  rasterOversample: 1.25,
  maxRasterSize: 256,
} as const;
