import {
  DEFAULT_FORMATION,
  DEFAULT_FORMATION_FONT,
  DEFAULT_IMAGE_COLORS,
  FORMATION_MIN_FIT,
} from "../config/FormationDefaults";
import { ResolveUtils } from "../core/resolve/ResolveUtils";
import { StyleResolver } from "../core/resolve/StyleResolver";
import type { FormationMode } from "../types/formation/FormationMode";
import type { FormationOptions } from "../types/formation/FormationOptions";
import { ImageSource } from "../utils/ImageSource";
import { MathUtils } from "../utils/MathUtils";
import type { IFormation } from "./abstracts/IFormation";
import type { IFormationSource } from "./abstracts/IFormationSource";
import { Formation } from "./concretes/Formation";
import { ImageFormationSource } from "./concretes/ImageFormationSource";
import { TextFormationSource } from "./concretes/TextFormationSource";

/**
 * Static Formation Resolver.
 * Validates public formation options and builds the formation of one burst. Installed by
 * `enableFormations()`, so the core never imports it.
 */
export class FormationResolver {
  /**
   * Valid Start Modes.
   */
  private static readonly MODES: readonly FormationMode[] = ["assemble", "appear"];

  /**
   * Build a Burst's Formation.
   *
   * @param options - Public Formation Options
   * @param limit - Largest Particle Count (an explicit `particleCount`, or Infinity)
   * @returns Formation
   * @throws TypeError for a missing or doubled source and for invalid settings
   */
  public static create(options: FormationOptions, limit: number): IFormation {
    const mode = options.mode ?? DEFAULT_FORMATION.mode;
    const assemble = options.assemble ?? DEFAULT_FORMATION.assemble;
    const hold = options.hold ?? DEFAULT_FORMATION.hold;
    const spacing = options.spacing ?? DEFAULT_FORMATION.spacing;
    const fit = options.fit ?? DEFAULT_FORMATION.fit;

    if (!FormationResolver.MODES.includes(mode)) {
      throw new TypeError(
        `konfeti: "formation.mode" must be "assemble" or "appear", got ${JSON.stringify(mode)}`,
      );
    }

    FormationResolver.assertAtLeastZero(assemble, "formation.assemble");
    FormationResolver.assertAtLeastZero(hold, "formation.hold");
    ResolveUtils.assertPositive(spacing, "formation.spacing");
    ResolveUtils.assertFinite(fit, "formation.fit");

    const source = FormationResolver.resolveSource(options);

    return new Formation(source, {
      mode,
      assemble: mode === "appear" ? 0 : assemble,
      hold,
      easing: StyleResolver.resolveEasing(options.easing ?? DEFAULT_FORMATION.easing),
      spacing,
      fit: MathUtils.clamp(fit, FORMATION_MIN_FIT, 1),
      imageColors: options.image !== undefined && (options.imageColors ?? DEFAULT_IMAGE_COLORS),
      limit,
    });
  }

  /**
   * Resolve the Shape Source (exactly one of `text` and `image`).
   *
   * @param options - Public Formation Options
   * @returns Formation Source
   * @throws TypeError when neither or both are set, for empty text or a non-positive width
   */
  private static resolveSource(options: FormationOptions): IFormationSource {
    const { text, image } = options;

    if ((text === undefined) === (image === undefined)) {
      throw new TypeError(`konfeti: "formation" needs either "text" or "image" (not both)`);
    }

    if (image !== undefined) {
      if (options.width !== undefined) {
        ResolveUtils.assertPositive(options.width, "formation.width");
      }

      return new ImageFormationSource(ImageSource.from(image), options.width ?? null);
    }

    if (typeof text !== "string" || text.trim() === "") {
      throw new TypeError(`konfeti: "formation.text" must be a non-empty string`);
    }

    return new TextFormationSource(text, options.font ?? DEFAULT_FORMATION_FONT);
  }

  /**
   * Check a Duration Is a Finite Number of Zero or More.
   *
   * @param value - Duration
   * @param name - Option Name for the Error Message
   * @throws TypeError for a negative or non-finite value
   */
  private static assertAtLeastZero(value: number, name: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(`konfeti: "${name}" must be zero or more, got ${String(value)}`);
    }
  }
}
