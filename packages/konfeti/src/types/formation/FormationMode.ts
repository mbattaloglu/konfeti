/**
 * How a Formation Starts.
 * - `"assemble"`: particles fly in from beyond the canvas edges and settle into the shape;
 * - `"appear"`: particles show up in the shape right away.
 *
 * Either way the shape is held for `hold` milliseconds, then the particles burst apart.
 */
export type FormationMode = "assemble" | "appear";
