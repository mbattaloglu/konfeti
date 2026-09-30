import type { CreateOptions } from "../types/CreateOptions";

/**
 * Default Instance Options.
 */
export const DEFAULT_CREATE_OPTIONS = {
  resize: true,
  zIndex: 100,
  maxParticles: 1500,
  maxDevicePixelRatio: 2,
  disableForReducedMotion: false,
  fixedTimestep: false,
} as const satisfies Required<Omit<CreateOptions, "defaults" | "frameScheduler">>;
