/**
 * Path That Remembers Its Path Data.
 * Installed as the global `Path2D` in tests: the canvas mock ignores the constructor argument, so without it two
 * different `path` shapes would resolve to look-alike paths.
 */
export class RecordingPath2D extends Path2D {
  /**
   * Path Data the Path Was Built From (null when built from another path or empty).
   */
  public readonly source: string | null;

  /**
   * Create Path and Remember Its Path Data.
   *
   * @param path - Path Data or Another Path
   */
  public constructor(path?: Path2D | string) {
    super(path);
    this.source = typeof path === "string" ? path : null;
  }
}
