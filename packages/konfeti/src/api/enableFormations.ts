import { FormationResolver } from "../formation/FormationResolver";
import { FormationSupport } from "../registry/FormationSupport";

/**
 * Enable Formations (text and images made of particles).
 * The full `konfeti` entry and `konfeti/worker` call it for you. With `konfeti/lite`, call it once before
 * firing a `formation`, so lite bundles that never form shapes stay small. Calling it again is harmless.
 *
 * @example
 * ```ts
 * import { Konfeti, enableFormations } from "konfeti/lite";
 *
 * enableFormations();
 * Konfeti.fire({ formation: { text: "HELLO" } });
 * ```
 */
export function enableFormations(): void {
  FormationSupport.install((options, limit) => FormationResolver.create(options, limit));
}
