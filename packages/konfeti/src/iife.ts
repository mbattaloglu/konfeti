// <script> build entry: locates konfeti.worker.js next to this script while it is still executing.
import { WorkerScriptLocation } from "./worker/WorkerScriptLocation";

export * from "./index";

// document.currentScript is only set during the script's first run
const script = typeof document === "undefined" ? null : document.currentScript;

if (script instanceof HTMLScriptElement && script.src !== "") {
  WorkerScriptLocation.setDefault(new URL("konfeti.worker.js", script.src).href);
}
