/**
 * Paper Silhouette.
 * - `"rect"` — rectangle using `width` × `height` (respects `cornerRadius`).
 * - `"square"` — like `"rect"`, but height always equals width.
 * - `"circle"` — ellipse filling `width` × `height` (a circle when both are equal).
 * - `"strip"` — pill shape: rectangle with fully rounded short ends. Looks best with a tall `height`.
 * - `"leaf"` — two opposite corners fully rounded (top-left and bottom-right), like a petal.
 */
export type PaperForm = "rect" | "square" | "circle" | "strip" | "leaf";
