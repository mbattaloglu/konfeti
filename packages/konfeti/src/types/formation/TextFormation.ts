import type { FormationBase } from "./FormationBase";

/**
 * Formation Spelled from Text.
 * The particles spell a word or a short message, centered on the burst's `origin`.
 *
 * @example
 * ```ts
 * Konfeti.fire({ formation: { text: "TEBRİKLER", font: "900 120px Inter" } });
 * Konfeti.fire({ formation: { text: "YOU\nWIN", mode: "appear", hold: 1500 } }); // two lines
 * ```
 */
export type TextFormation = FormationBase & {
  /**
   * Text.
   * What the particles spell. `\n` starts a new line; lines are centered. Must not be empty.
   *
   * @example
   * ```ts
   * formation: { text: "LEVEL\nUP" }
   * ```
   */
  readonly text: string;
  /**
   * Font.
   * A CSS font shorthand (`weight size family`). Heavy weights read best, since the particles fill the
   * letter strokes.
   *
   * @defaultValue `"900 96px sans-serif"`
   * @example
   * ```ts
   * formation: { text: "GO!", font: "bold 140px 'Luckiest Guy'" }
   * ```
   * @remarks The size is the size on screen before `fit` scales the shape down. A web font that is still
   * loading is waited for (through `document.fonts`). Worker instances only see fonts the worker itself
   * knows: system fonts, or a `FontFace` loaded inside the worker.
   */
  readonly font?: string;
  /**
   * Not Used by Text Formations (set either `text` or `image`).
   */
  readonly image?: never;
  /**
   * Not Used by Text Formations (the font size sets the size).
   */
  readonly width?: never;
  /**
   * Not Used by Text Formations (particles keep their own colors).
   */
  readonly imageColors?: never;
};
