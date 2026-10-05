import type { SpriteAtlasFrame } from "./SpriteAtlasFrame";

/**
 * Sprite Atlas JSON.
 * The frame list a sprite packer exports next to the sheet image (TexturePacker, Aseprite, Free Texture Packer,
 * Phaser). Both layouts are accepted: "JSON Hash" (`frames` keyed by frame name) and "JSON Array" (`frames` as a list
 * with a `filename` each). Other fields (`meta`, `sourceSize`, `duration` …) are ignored.
 *
 * @example
 * ```json
 * { "frames": { "coin_0.png": { "frame": { "x": 0, "y": 0, "w": 32, "h": 32 } } }, "meta": { "image": "coins.png" } }
 * ```
 */
export type SpriteAtlas = {
  /**
   * Frames, Keyed by Name or Listed.
   */
  readonly frames: Readonly<Record<string, SpriteAtlasFrame>> | readonly SpriteAtlasFrame[];
};
