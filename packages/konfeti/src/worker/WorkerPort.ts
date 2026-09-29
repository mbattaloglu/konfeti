import type { MainToWorker, WorkerToMain } from "./WorkerProtocol";

/**
 * Typed View of a Worker (or a test double speaking the same protocol).
 */
export type WorkerPort = {
  /**
   * Send Message to the Worker.
   *
   * @param message - Protocol Message
   * @param transfer - Objects to Transfer (the OffscreenCanvas on init)
   */
  postMessage(message: MainToWorker, transfer?: Transferable[]): void;
  /**
   * Message Callback.
   */
  onmessage: ((event: { readonly data: WorkerToMain }) => void) | null;
  /**
   * Error Callback (script failed to load, or an uncaught error inside the worker).
   */
  onerror: ((event: unknown) => void) | null;
  /**
   * Stop the Worker.
   */
  terminate(): void;
};
