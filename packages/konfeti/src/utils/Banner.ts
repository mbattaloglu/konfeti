import { VERSION } from "../Version";

/**
 * Title Row Style (blocks and badge share one font, so their boxes are the same height).
 * The explicit line height equals the padded box height: rows touch without gaps at any console line height.
 */
const TITLE = "font:bold 16px/28px Georgia,serif;padding:6px 0;background:";

/**
 * Info Row Style (version and link; same idea at 11px).
 */
const INFO = "font:11px/19px monospace;padding:4px 8px;background:";

/**
 * Segment Styles: four confetti blocks (default palette) and the name badge on row one, then an unstyled
 * line break, then version / renderer on white and the link on the brand lime.
 * The break gets its own segment: inside a styled one, an empty fragment of that style would start the next
 * row (a stray box plus the taller line height, which opened a gap).
 * Module constants, not static fields: static fields that read the class keep it in bundles that never print.
 */
const BANNER_STYLES = [
  `${TITLE}#26ccff`,
  `${TITLE}#a25afd`,
  `${TITLE}#ff5e7e`,
  `${TITLE}#fcff42`,
  `${TITLE}#0b0d10;color:#d6ff3f;padding:6px 12px`,
  "",
  `${INFO}#fff;color:#0b0d10`,
  `${INFO}#d6ff3f`,
] as const;

/**
 * Static Console Banner.
 * Prints the konfeti version and renderer once per page, when the first instance is created.
 */
export class Banner {
  /**
   * Project Homepage Shown in the Banner.
   */
  private static readonly HOMEPAGE = "https://konfeti.mbattaloglu.com";

  /**
   * Printed or Disabled Flag (the banner never prints twice).
   */
  private static _isDone = false;

  /**
   * Print Banner (first call only; no-op outside browsers).
   *
   * @param renderer - Renderer Description (e.g. `canvas 2d`)
   */
  public static show(renderer: string): void {
    if (Banner._isDone || typeof window === "undefined") {
      return;
    }

    Banner._isDone = true;
    console.log(
      `%c    %c    %c    %c    %c konfeti %c\n%c v${VERSION} · ${renderer} %c${Banner.HOMEPAGE} `,
      ...BANNER_STYLES,
    );
  }

  /**
   * Suppress the Banner for the Rest of the Page.
   */
  public static disable(): void {
    Banner._isDone = true;
  }
}
