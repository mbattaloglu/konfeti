import { WORKER_SOURCE } from "./generated/WorkerSource";
import type { WorkerPort } from "./WorkerPort";
import { WorkerScriptLocation } from "./WorkerScriptLocation";

/**
 * Start the konfeti Worker.
 * Loaded lazily (dynamic import) so the inlined worker script only downloads when a worker instance is created.
 *
 * @param url - Self-Hosted Worker Script (`konfeti/worker.js`); omitted uses the default location or the inlined script
 * @returns Worker Port
 */
export function spawnWorker(url?: string | URL): WorkerPort {
  const scriptUrl = url ?? WorkerScriptLocation.getDefault();

  if (scriptUrl !== null) {
    // DOM boundary: Worker speaks our protocol once the script runs
    return new Worker(scriptUrl) as unknown as WorkerPort;
  }

  if (WORKER_SOURCE === "") {
    throw new Error(
      "konfeti: cannot locate konfeti.worker.js — pass { workerUrl } to KonfetiFactory.createWorker()",
    );
  }

  const blobUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
  const worker = new Worker(blobUrl);

  // the worker posts "ready" first; after that the blob URL is no longer needed
  worker.addEventListener(
    "message",
    () => {
      URL.revokeObjectURL(blobUrl);
    },
    { once: true },
  );

  return worker as unknown as WorkerPort;
}
