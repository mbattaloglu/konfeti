import type { FormationFactory } from "../formation/abstracts/FormationFactory";
import type { IFormation } from "../formation/abstracts/IFormation";
import type { FormationOptions } from "../types/formation/FormationOptions";

/**
 * Static Formation Registry.
 * Holds the formation implementation that `enableFormations()` installs. The full `konfeti` entry and
 * `konfeti/worker` install it on import; `konfeti/lite` only when you call it, so lite bundles that never
 * form shapes carry none of the code.
 */
export class FormationSupport {
  /**
   * Installed Factory, or Null.
   */
  private static factory: FormationFactory | null = null;

  /**
   * Install the Formation Implementation.
   *
   * @param factory - Formation Factory
   */
  public static install(factory: FormationFactory): void {
    FormationSupport.factory = factory;
  }

  /**
   * Build a Burst's Formation.
   *
   * @param options - Public Formation Options
   * @param limit - Largest Particle Count (an explicit `particleCount`, or Infinity)
   * @returns Formation
   * @throws TypeError when formations are not enabled, and for invalid options
   */
  public static create(options: FormationOptions, limit: number): IFormation {
    if (FormationSupport.factory === null) {
      throw new TypeError(
        `konfeti: "formation" is not enabled — call enableFormations() when using konfeti/lite`,
      );
    }

    return FormationSupport.factory(options, limit);
  }
}
