/**
 * Worker-Safe Version of an Option Type.
 * Recursively removes everything `postMessage` cannot copy into a worker: functions (hooks, easing functions,
 * custom draw), `Path2D` and DOM image sources. `ImageBitmap`s and URL strings stay; plain `Element` origins
 * stay too because the main thread measures them before posting.
 */
export type Cloneable<T> = T extends (...args: never[]) => unknown
  ? never
  : T extends string | number | boolean | null | undefined
    ? T
    : T extends ImageBitmap
      ? T
      : T extends CanvasImageSource | Path2D
        ? never
        : T extends Element
          ? T
          : { [K in keyof T]: Cloneable<T[K]> };
