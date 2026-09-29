import type { RangeTuple } from "../Range";

/**
 * Origin with a Concrete Place.
 * Element origins are measured at each emission; client points are mapped into canvas space.
 */
export type PlacedOrigin =
  | { readonly kind: "point"; readonly x: RangeTuple; readonly y: RangeTuple }
  | { readonly kind: "element"; readonly element: Element }
  | { readonly kind: "client"; readonly clientX: number; readonly clientY: number };
