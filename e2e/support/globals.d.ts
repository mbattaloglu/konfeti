import type * as Konfeti from "konfeti";

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augments the DOM Window
  interface Window {
    /**
     * The Library Namespace (set by `pages/esm.html`; the `<script>` build defines it itself).
     */
    konfeti: typeof Konfeti;
  }
}
