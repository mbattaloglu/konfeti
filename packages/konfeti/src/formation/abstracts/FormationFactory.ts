import type { FormationOptions } from "../../types/formation/FormationOptions";
import type { IFormation } from "./IFormation";

/**
 * Formation Factory (installed by `enableFormations()`).
 * Validates the public options and builds the formation of one burst.
 */
export type FormationFactory = (options: FormationOptions, limit: number) => IFormation;
