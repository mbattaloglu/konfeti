/**
 * Static Instance-Creation Announcer.
 * Core modules report "an instance was created with this renderer" here; the full entry installs the console
 * banner as the listener, so `konfeti/lite` bundles never carry the banner code.
 */
export class Announcer {
  /**
   * Listener Installed by the Full Entry, or Null.
   */
  private static listener: ((renderer: string) => void) | null = null;

  /**
   * Install Listener.
   *
   * @param listener - Called with the Renderer Name of Each New Instance
   */
  public static setListener(listener: (renderer: string) => void): void {
    Announcer.listener = listener;
  }

  /**
   * Report a New Instance.
   *
   * @param renderer - Renderer Description (e.g. `canvas 2d`)
   */
  public static announce(renderer: string): void {
    Announcer.listener?.(renderer);
  }
}
