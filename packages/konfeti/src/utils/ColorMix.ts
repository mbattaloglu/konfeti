import type { Rgba } from "../types/resolved/Rgba";
import { ColorUtils } from "./ColorUtils";
import { MathUtils } from "./MathUtils";

/**
 * Static Color Interpolation Helpers.
 */
export class ColorMix {
  /**
   * Build Color Transition Lookup Table.
   *
   * @param from - Start Color
   * @param to - End Color
   * @param steps - Table Size (≥ 2)
   * @returns CSS Color List from Start to End
   */
  public static table(from: Rgba, to: Rgba, steps: number): string[] {
    const table: string[] = [];
    const last = Math.max(steps - 1, 1);

    for (let index = 0; index <= last; index++) {
      const t = index / last;
      table.push(
        ColorUtils.toCss({
          r: MathUtils.lerp(from.r, to.r, t),
          g: MathUtils.lerp(from.g, to.g, t),
          b: MathUtils.lerp(from.b, to.b, t),
          a: MathUtils.lerp(from.a, to.a, t),
        }),
      );
    }

    return table;
  }
}
