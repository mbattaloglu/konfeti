import { KonfetiFactory, loadImage, presets, VERSION, WorkerKonfetiInstance } from "konfeti";
import type { FireInput, KonfetiHandle, KonfetiInstance, WorkerFireInput } from "konfeti";

import { buildOptions } from "./buildOptions";
import { CONTROL_SECTIONS } from "./controls";
import type { ControlState } from "./controlTypes";
import { createDemoAssets } from "./demoAssets";
import { buildHooks, createCounters } from "./hooks";
import { t } from "./i18n/messages";
import { localizeSections } from "./i18n/localizeControls";
import { applyStaticText, mountLanguageSwitch } from "./i18n/staticText";
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
 * Placeholder for Counters that Cannot Be Measured in the Current Mode.
 */
const NO_VALUE = "–";

/**
 * Stat Elements Fed Only by Hooks (unavailable in worker mode).
 */
const HOOK_STATS = ["stat-spawned", "stat-died", "stat-updated"] as const;

/**
 * Stage Instance: main-thread or worker-rendered.
 */
type Stage = KonfetiInstance | WorkerKonfetiInstance;

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
 * Create Stage Instance on a Fresh Canvas.
 * A canvas that already has a 2D context cannot be transferred to a worker (and a transferred one cannot draw
 * on the main thread again), so every switch swaps in a new canvas element.
 *
 * @param useWorker - Render in a Web Worker
 * @returns Stage Instance
 */
function createStage(useWorker: boolean): Stage {
  const previous = byId("stage-canvas", HTMLCanvasElement);
  const canvas = el("canvas", "stage-canvas");
  canvas.id = previous.id;
  canvas.setAttribute("aria-hidden", "true");
  previous.replaceWith(canvas);

  return useWorker ? KonfetiFactory.createWorker(canvas) : KonfetiFactory.create(canvas);
}

/**
 * Fire on a Stage.
 * Worker stages cannot run hooks (functions do not cross the thread boundary), so they get the plain options;
 * anything else that is not cloneable (e.g. a canvas image source) throws a readable TypeError.
 *
 * @param stage - Stage Instance
 * @param input - Burst Options
 * @param hooks - Adds Playground Hooks (main thread only)
 * @returns Burst Handle
 */
function fireOn(
  stage: Stage,
  input: FireInput,
  hooks: (input: FireInput) => FireInput,
): KonfetiHandle {
  // the worker validates cloneability at runtime and throws a TypeError naming the problem
  return stage instanceof WorkerKonfetiInstance
    ? stage.fire(input as WorkerFireInput)
    : stage.fire(hooks(input));
}

/**
 * Wire Up the Playground.
 */
async function init(): Promise<void> {
  // translate the static markup first, before the demo assets load
  applyStaticText(document, "playground.title");
  mountLanguageSwitch(byId("lang-switch", HTMLElement));
  const assets = await createDemoAssets();
  const state: ControlState = {};
  const counters = createCounters();
  // the stage is a regular canvas element, so the whole playground is a KonfetiFactory.create(canvas) demo
  let main: Stage = createStage(false);
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
      const handle = fireOn(main, input, withHooks);
      lastHandle = handle;

      // no onComplete in a worker: count finished bursts from the handle instead
      if (main instanceof WorkerKonfetiInstance) {
        handle.then(
          () => {
            counters.completed++;
          },
          (error: unknown) => {
            showToast(error instanceof Error ? error.message : String(error), true);
          },
        );
      }
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
    jsonState.textContent = t("json.synced");
    jsonState.classList.remove("is-dirty");
  };

  // declarative controls
  const controls = renderControls(
    byId("controls", HTMLElement),
    localizeSections(CONTROL_SECTIONS),
    state,
    (key) => {
      if (key === "image.upload") {
        const url = str(state, "image.upload");

        if (url !== "") {
          loadImage(url)
            .then((image: HTMLImageElement) => {
              controls.setValue("image.src", "upload");
              controls.setValue("image.enabled", true);
              showToast(
                t("image.loaded", { width: image.naturalWidth, height: image.naturalHeight }),
              );
            })
            .catch((error: unknown) => {
              showToast(error instanceof Error ? error.message : t("image.failed"), true);
            });
        }
      }

      syncJson();
    },
  );

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
    jsonState.textContent = t("json.edited");
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
        showToast(t("json.copied"));
      },
      () => {
        showToast(t("clipboard.unavailable"), true);
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
      const clickOptions = (): FireInput => buildOptions(state, assets, { includeOrigin: false });
      // worker stages get plain options (see fireOn); main-thread stages also run the hooks
      unsubscribeClick =
        main instanceof WorkerKonfetiInstance
          ? main.onClick(stageHit, () => clickOptions() as WorkerFireInput)
          : main.onClick(stageHit, () => withHooks(clickOptions()));
    }
  };
  clickToggle.addEventListener("change", applyClickToggle);
  applyClickToggle();

  // worker mode (KonfetiFactory.createWorker)
  const workerToggle = byId("worker-mode", HTMLInputElement);
  workerToggle.addEventListener("change", () => {
    main.destroy();
    main = createStage(workerToggle.checked);
    lastHandle = null;
    applyClickToggle();

    for (const id of HOOK_STATS) {
      const stat = byId(id, HTMLElement).parentElement;
      stat?.classList.toggle("is-unavailable", workerToggle.checked);

      if (workerToggle.checked) {
        stat?.setAttribute("title", t("stats.hooksOnly"));
      } else {
        stat?.removeAttribute("title");
      }
    }

    if (main instanceof WorkerKonfetiInstance && !main.isWorker()) {
      showToast(t("worker.unsupported"), true);
    } else if (workerToggle.checked) {
      showToast(t("worker.enabled"));
    }
  });

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
    // spawn / death / update counts come from hooks, which never run inside a worker
    const hooksRun = !(main instanceof WorkerKonfetiInstance);
    labels.spawned.textContent = hooksRun ? COMPACT.format(counters.spawned) : NO_VALUE;
    labels.died.textContent = hooksRun ? COMPACT.format(counters.died) : NO_VALUE;
    labels.completed.textContent = COMPACT.format(counters.completed);
    labels.updated.textContent = hooksRun ? COMPACT.format(counters.updated) : NO_VALUE;

    const status =
      lastHandle === null
        ? "idle"
        : lastHandle.isFinished()
          ? "finished"
          : lastHandle.isPaused()
            ? "paused"
            : "running";
    statusText.textContent = t(`status.${status}` as const);
    statusChip.dataset["status"] = status;
    requestAnimationFrame(tick);
  };

  syncJson(true);
  requestAnimationFrame(tick);
}

void init();
