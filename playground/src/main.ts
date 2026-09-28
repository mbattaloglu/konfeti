import { KonfetiFactory, loadImage, presets, VERSION } from "konfeti";
import type { FireInput, KonfetiHandle } from "konfeti";

import { buildOptions } from "./buildOptions";
import { CONTROL_SECTIONS } from "./controls";
import type { ControlState } from "./controlTypes";
import { createDemoAssets } from "./demoAssets";
import { buildHooks, createCounters } from "./hooks";
import { isBurstList, parseJson, toJson } from "./jsonIO";
import { str } from "./stateReaders";
import { byId, el } from "./ui/dom";
import { renderControls } from "./ui/renderControls";
import { renderPresets } from "./ui/renderPresets";

/**
 * Stats Refresh Interval.
 */
const FPS_SAMPLE_MS = 500;

/**
 * Event Log Length.
 */
const EVENT_LOG_SIZE = 50;

/**
 * Toast Visibility Duration.
 */
const TOAST_MS = 2600;

/**
 * Viewport Width below which the Hook Log Starts Collapsed.
 */
const COMPACT_QUERY = "(max-width: 720px)";

/**
 * Compact Number Formatter for Counters.
 */
const COMPACT = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Check Whether a Keyboard Event Comes from an Editable Field.
 *
 * @param event - Keyboard Event
 * @returns Whether the Target Accepts Typing
 */
function isTyping(event: KeyboardEvent): boolean {
  const target = event.target;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Wire Up the Playground.
 */
async function init(): Promise<void> {
  const assets = await createDemoAssets();
  const state: ControlState = {};
  const counters = createCounters();
  // the stage is a regular canvas element, so the whole playground is a KonfetiFactory.create(canvas) demo
  const main = KonfetiFactory.create(byId("stage-canvas", HTMLCanvasElement));
  const jsonArea = byId("json", HTMLTextAreaElement);
  const jsonState = byId("json-state", HTMLElement);
  const toast = byId("toast", HTMLElement);
  const eventLog = byId("event-log", HTMLOListElement);
  const statusChip = byId("status", HTMLElement);
  const statusText = byId("status-text", HTMLElement);
  const stageHit = byId("stage-hit", HTMLElement);
  let lastHandle: KonfetiHandle | null = null;
  let jsonDirty = false;
  let toastTimer = 0;

  byId("version", HTMLElement).textContent = `v${VERSION}`;

  const showToast = (message: string, isError = false): void => {
    toast.textContent = message;
    toast.classList.toggle("is-error", isError);
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, TOAST_MS);
  };

  const logEvent = (name: string): void => {
    const item = el("li");
    item.append(
      el("code", undefined, name),
      el("time", undefined, new Date().toLocaleTimeString()),
    );
    eventLog.prepend(item);

    while (eventLog.children.length > EVENT_LOG_SIZE) {
      eventLog.lastElementChild?.remove();
    }
  };

  const withHooks = (input: FireInput): FireInput => {
    const hooks = buildHooks(state, counters, logEvent);

    return isBurstList(input)
      ? input.map((options) => ({ ...options, ...hooks }))
      : { ...input, ...hooks };
  };

  const fireMain = (input: FireInput): void => {
    try {
      lastHandle = main.fire(withHooks(input));
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error), true);
    }
  };

  const syncJson = (force = false): void => {
    if (jsonDirty && !force) {
      return;
    }

    jsonArea.value = toJson(buildOptions(state, assets), assets);
    jsonDirty = false;
    jsonState.textContent = "synced with controls";
    jsonState.classList.remove("is-dirty");
  };

  // declarative controls
  const controls = renderControls(byId("controls", HTMLElement), CONTROL_SECTIONS, state, (key) => {
    if (key === "image.upload") {
      const url = str(state, "image.upload");

      if (url !== "") {
        loadImage(url)
          .then((image: HTMLImageElement) => {
            controls.setValue("image.src", "upload");
            controls.setValue("image.enabled", true);
            showToast(`Image loaded · ${image.naturalWidth}×${image.naturalHeight}`);
          })
          .catch((error: unknown) => {
            showToast(error instanceof Error ? error.message : "Image failed to load", true);
          });
      }
    }

    syncJson();
  });

  byId("reset-controls", HTMLButtonElement).addEventListener("click", () => {
    controls.reset();
    syncJson(true);
  });

  // top bar
  byId("fire", HTMLButtonElement).addEventListener("click", () => {
    fireMain(buildOptions(state, assets));
  });
  byId("pause", HTMLButtonElement).addEventListener("click", () => lastHandle?.pause());
  byId("resume", HTMLButtonElement).addEventListener("click", () => lastHandle?.resume());
  byId("stop", HTMLButtonElement).addEventListener("click", () => lastHandle?.stop());
  byId("reset", HTMLButtonElement).addEventListener("click", () => {
    main.reset();
    Object.assign(counters, createCounters());
    eventLog.replaceChildren();
  });

  // presets gallery
  renderPresets(byId("presets", HTMLElement), (name) => {
    fireMain(presets[name]());
  });

  // json panel
  jsonArea.addEventListener("input", () => {
    jsonDirty = true;
    jsonState.textContent = "edited — controls no longer sync";
    jsonState.classList.add("is-dirty");
  });
  byId("fire-json", HTMLButtonElement).addEventListener("click", () => {
    try {
      fireMain(parseJson(jsonArea.value, assets));
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error), true);
    }
  });
  byId("sync-json", HTMLButtonElement).addEventListener("click", () => {
    syncJson(true);
  });
  byId("copy-json", HTMLButtonElement).addEventListener("click", () => {
    navigator.clipboard.writeText(jsonArea.value).then(
      () => {
        showToast("JSON copied to clipboard");
      },
      () => {
        showToast("Clipboard unavailable", true);
      },
    );
  });

  // click anywhere on the stage (onClick)
  let unsubscribeClick: (() => void) | null = null;
  const clickToggle = byId("click-fire", HTMLInputElement);
  const applyClickToggle = (): void => {
    unsubscribeClick?.();
    unsubscribeClick = null;
    document.body.classList.toggle("is-click-fire", clickToggle.checked);

    if (clickToggle.checked) {
      unsubscribeClick = main.onClick(stageHit, () =>
        withHooks(buildOptions(state, assets, { includeOrigin: false })),
      );
    }
  };
  clickToggle.addEventListener("change", applyClickToggle);
  applyClickToggle();

  // phones start with the hook log collapsed so the stage stays visible
  if (window.matchMedia(COMPACT_QUERY).matches) {
    byId("hook-log", HTMLDetailsElement).open = false;
  }

  // keyboard: F fires
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "f" && !isTyping(event) && !event.metaKey && !event.ctrlKey) {
      fireMain(buildOptions(state, assets));
    }
  });

  // live stats
  const labels = {
    live: byId("stat-live", HTMLElement),
    fps: byId("stat-fps", HTMLElement),
    spawned: byId("stat-spawned", HTMLElement),
    died: byId("stat-died", HTMLElement),
    completed: byId("stat-completed", HTMLElement),
    updated: byId("stat-updated", HTMLElement),
  };
  let frames = 0;
  let lastSample = performance.now();

  const tick = (now: number): void => {
    frames++;

    if (now - lastSample >= FPS_SAMPLE_MS) {
      labels.fps.textContent = String(Math.round((frames * 1000) / (now - lastSample)));
      frames = 0;
      lastSample = now;
    }

    labels.live.textContent = COMPACT.format(main.getParticleCount());
    labels.spawned.textContent = COMPACT.format(counters.spawned);
    labels.died.textContent = COMPACT.format(counters.died);
    labels.completed.textContent = COMPACT.format(counters.completed);
    labels.updated.textContent = COMPACT.format(counters.updated);

    const status =
      lastHandle === null
        ? "idle"
        : lastHandle.isFinished()
          ? "finished"
          : lastHandle.isPaused()
            ? "paused"
            : "running";
    statusText.textContent = status;
    statusChip.dataset["status"] = status;
    requestAnimationFrame(tick);
  };

  syncJson(true);
  requestAnimationFrame(tick);
}

void init();
