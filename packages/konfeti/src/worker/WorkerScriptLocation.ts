/**
 * Static Default Worker Script Location.
 * The `<script>` build sets it to the `konfeti.worker.js` next to itself; bundler builds leave it empty and
 * inline the worker script instead.
 */
export class WorkerScriptLocation {
  /**
   * Default Worker Script URL, or Null to Use the Inlined Script.
   */
  private static url: string | null = null;

  /**
   * Set Default Worker Script URL.
   *
   * @param url - Absolute Worker Script URL
   */
  public static setDefault(url: string): void {
    WorkerScriptLocation.url = url;
  }

  /**
   * Return Default Worker Script URL.
   *
   * @returns URL, or Null to Use the Inlined Script
   */
  public static getDefault(): string | null {
    return WorkerScriptLocation.url;
  }
}
