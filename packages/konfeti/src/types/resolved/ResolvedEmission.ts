/**
 * Fully Resolved Emission Timing.
 */
export type ResolvedEmission =
  | { readonly mode: "burst" }
  | { readonly mode: "stream"; readonly duration: number }
  | { readonly mode: "interval"; readonly every: number; readonly times: number }
  | { readonly mode: "continuous"; readonly rate: number };
