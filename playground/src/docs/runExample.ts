import {
  definePhysics,
  defineShape,
  emojiShape,
  extendPreset,
  Konfeti,
  KonfetiFactory,
  KonfetiPresets,
  loadImage,
  registerShapes,
  starShape,
} from "konfeti";

/**
 * Library Bindings Available to Runnable Examples (in place of their `import` lines).
 */
const SCOPE = {
  Konfeti,
  KonfetiFactory,
  KonfetiPresets,
  extendPreset,
  defineShape,
  definePhysics,
  registerShapes,
  starShape,
  emojiShape,
  loadImage,
} as const;

/**
 * Async Function Constructor Type.
 */
type AsyncFunctionConstructor = new (
  ...args: string[]
) => (...values: unknown[]) => Promise<unknown>;

/**
 * Resolve Immediately (only used to reach the AsyncFunction constructor).
 */
async function asyncNoop(): Promise<void> {
  await Promise.resolve();
}

/**
 * Async Function Constructor (supports top-level `await` inside examples).
 */
const AsyncFunction = (
  Object.getPrototypeOf(asyncNoop) as { constructor: AsyncFunctionConstructor }
).constructor;

/**
 * Import Line Pattern (examples import from "konfeti"; the docs page injects the bindings instead).
 */
const IMPORT_LINE = /^\s*import\s[^;]*;\s*$/gm;

/**
 * Run a Documentation Example.
 * Examples are authored in this repository (the README), never user input.
 *
 * @param source - Example Source (JavaScript-compatible TypeScript)
 * @returns Promise Settling when the Example Finishes
 */
export async function runExample(source: string): Promise<void> {
  const body = source.replace(IMPORT_LINE, "");
  const run = new AsyncFunction(...Object.keys(SCOPE), body);
  await run(...Object.values(SCOPE));
}
