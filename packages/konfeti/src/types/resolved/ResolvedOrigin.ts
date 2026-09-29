import type { OriginTracker } from "../../core/OriginTracker";
import type { PlacedOrigin } from "./PlacedOrigin";

/**
 * Fully Resolved Origin.
 * A placed origin, or a tracker whose current place is read at every emission (continuous emitters).
 */
export type ResolvedOrigin =
  PlacedOrigin | { readonly kind: "tracked"; readonly tracker: OriginTracker };
