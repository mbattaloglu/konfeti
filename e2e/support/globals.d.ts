import type * as Konfeti from "konfeti";
import type * as KonfetiWorker from "konfeti/worker";

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augments the DOM Window
  interface Window {
    /**
     * The Library Namespace: `konfeti` plus `konfeti/worker` (merged by `pages/esm.html`; the `<script>`
     * build defines both itself).
     */
    konfeti: typeof Konfeti & typeof KonfetiWorker;
  }
}
