import type { RangeTuple } from "../Range";

/**
 * Fully Resolved Origin.
 * Element origins are measured at each emission; client points are mapped into canvas space.
 */
export type ResolvedOrigin =
  | { readonly kind: "point"; readonly x: RangeTuple; readonly y: RangeTuple }
  | { readonly kind: "element"; readonly element: Element }
  | { readonly kind: "client"; readonly clientX: number; readonly clientY: number };
