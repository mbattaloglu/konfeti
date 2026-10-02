import { t } from "../i18n/messages";
import { el } from "./dom";

/**
 * Id Prefix of the Tab Buttons (`burst-tab-1` …).
 */
const TAB_ID_PREFIX = "burst-tab-";

/**
 * Rendered Burst Tabs.
 */
export type BurstTabsView = {
  /**
   * Draw the Tabs for a Burst Count and the Shown Burst.
   */
  readonly render: (count: number, active: number) => void;
};

/**
 * Build the Id of a Tab Button.
 *
 * @param index - Tab Index (0-based)
 * @returns Element Id (numbered from 1, like the tab text)
 */
function tabId(index: number): string {
  return `${TAB_ID_PREFIX}${String(index + 1)}`;
}

/**
 * Render the Burst Tabs (the WAI-ARIA tabs pattern with a roving tabindex).
 * Tab enters and leaves the tab list in one step; ArrowLeft / ArrowRight pick the previous / next tab (wrapping),
 * Home / End the first / last.
 *
 * @param list - Tab List Element (`role="tablist"`)
 * @param panel - Element the Tabs Control (`#controls`, `role="tabpanel"`)
 * @param onSelect - Called with the Index of a Picked Tab
 * @returns Burst Tabs View
 */
export function renderBurstTabs(
  list: HTMLElement,
  panel: HTMLElement,
  onSelect: (index: number) => void,
): BurstTabsView {
  let count = 1;
  let active = 0;

  const pick = (index: number): void => {
    onSelect(index);
    // the tabs were drawn again, so the new tab button is a fresh element
    list.querySelector<HTMLElement>(`#${tabId(index)}`)?.focus();
  };

  list.addEventListener("keydown", (event) => {
    const next =
      event.key === "ArrowRight"
        ? (active + 1) % count
        : event.key === "ArrowLeft"
          ? (active - 1 + count) % count
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : null;

    if (next !== null) {
      event.preventDefault();
      pick(next);
    }
  });

  return {
    render: (nextCount, nextActive) => {
      count = nextCount;
      active = nextActive;
      list.replaceChildren(
        ...Array.from({ length: count }, (_unused, index) => {
          const selected = index === active;
          const tab = el("button", "burst-tab", t("bursts.tab", { n: index + 1 }));
          tab.type = "button";
          tab.id = tabId(index);
          tab.setAttribute("role", "tab");
          tab.setAttribute("aria-selected", String(selected));
          tab.setAttribute("aria-controls", panel.id);
          tab.tabIndex = selected ? 0 : -1;
          tab.addEventListener("click", () => {
            pick(index);
          });

          return tab;
        }),
      );
      panel.setAttribute("aria-labelledby", tabId(active));
    },
  };
}
