import { el } from "./dom";

/**
 * Gap Between Trigger and Tooltip.
 */
const OFFSET_PX = 8;

/**
 * Minimum Distance from the Viewport Edge.
 */
const EDGE_PX = 8;

/**
 * Shared Tooltip Element (created on first use).
 */
let tooltip: HTMLElement | null = null;

/**
 * Trigger the Tooltip Currently Belongs to.
 */
let owner: HTMLElement | null = null;

/**
 * Return Shared Tooltip Element, Creating It Once.
 * It lives on `<body>` with fixed positioning, so the scrolling control panel cannot clip it.
 *
 * @returns Tooltip Element
 */
function getTooltip(): HTMLElement {
  if (tooltip === null) {
    tooltip = el("div", "hint-tooltip");
    tooltip.id = "hint-tooltip";
    tooltip.setAttribute("role", "tooltip");
    document.body.append(tooltip);

    // the panel scrolls under a fixed tooltip, so hide instead of drifting away from the trigger
    window.addEventListener("scroll", hideHint, { capture: true, passive: true });
    window.addEventListener("resize", hideHint);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideHint();
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (owner !== null && event.target instanceof Node && !owner.contains(event.target)) {
        hideHint();
      }
    });
  }

  return tooltip;
}

/**
 * Show Tooltip for a Trigger (above it; below when there is no room).
 *
 * @param trigger - Hint Trigger
 * @param text - Tooltip Text
 */
function showHint(trigger: HTMLElement, text: string): void {
  const tip = getTooltip();
  tip.textContent = text;
  tip.classList.add("is-visible");
  owner = trigger;
  trigger.setAttribute("aria-describedby", tip.id);

  const anchor = trigger.getBoundingClientRect();
  const box = tip.getBoundingClientRect();
  const left = Math.min(
    Math.max(anchor.left + anchor.width / 2 - box.width / 2, EDGE_PX),
    window.innerWidth - box.width - EDGE_PX,
  );
  const above = anchor.top - box.height - OFFSET_PX;
  const top = above >= EDGE_PX ? above : anchor.bottom + OFFSET_PX;

  tip.style.left = `${String(Math.round(left))}px`;
  tip.style.top = `${String(Math.round(top))}px`;
}

/**
 * Hide the Tooltip.
 */
function hideHint(): void {
  tooltip?.classList.remove("is-visible");
  owner?.removeAttribute("aria-describedby");
  owner = null;
}

/**
 * Create Hint Trigger (`?` button) that Shows Text on Hover, Focus and Tap.
 *
 * @param text - Tooltip Text
 * @param label - Accessible Name of the Button
 * @returns Trigger Button
 */
export function createHint(text: string, label: string): HTMLButtonElement {
  const trigger = el("button", "control-hint", "?");
  trigger.type = "button";
  trigger.setAttribute("aria-label", label);

  trigger.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      showHint(trigger, text);
    }
  });
  trigger.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      hideHint();
    }
  });
  trigger.addEventListener("focus", () => {
    showHint(trigger, text);
  });
  trigger.addEventListener("blur", hideHint);
  // touch has no hover: a tap shows the tooltip, a tap elsewhere hides it; preventDefault keeps a wrapping
  // <label> from toggling its switch
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showHint(trigger, text);
  });

  return trigger;
}
