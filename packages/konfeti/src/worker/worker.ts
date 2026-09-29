// konfeti worker entry: bundled into a standalone script (inlined as a blob and shipped as konfeti/worker.js).
import { registerShapes } from "../api/registerShapes";
import { BUILTIN_SHAPES } from "../shapes/handlers/BuiltinShapes";
import { CanvasFactory } from "../utils/CanvasFactory";
import { ImageSource } from "../utils/ImageSource";
import { BitmapLoader } from "./BitmapLoader";
import { OffscreenScratch } from "./OffscreenScratch";
import type { MainToWorker, WorkerToMain } from "./WorkerProtocol";
import { WorkerRuntime } from "./WorkerRuntime";

/**
 * The Parts of the Dedicated Worker Global Scope This Entry Uses.
 */
type WorkerScope = Partial<Pick<Window, "requestAnimationFrame" | "cancelAnimationFrame">> & {
  /**
   * Post Message to the Main Thread.
   */
  postMessage(message: WorkerToMain): void;
  /**
   * Message Callback.
   */
  onmessage: ((event: MessageEvent<MainToWorker>) => void) | null;
};

registerShapes(...BUILTIN_SHAPES);
ImageSource.setUrlLoader((url) => BitmapLoader.load(url));
CanvasFactory.setFallback((width, height) => OffscreenScratch.create(width, height));

// the DOM lib types `self` as Window; inside a dedicated worker it is the worker scope
const scope = globalThis as unknown as WorkerScope;
const runtime = new WorkerRuntime((message) => {
  scope.postMessage(message);
}, WorkerRuntime.createScheduler(scope));

scope.onmessage = (event) => {
  runtime.handle(event.data);
};
scope.postMessage({ type: "ready" });
