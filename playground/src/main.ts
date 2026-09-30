import { KonfetiFactory, KonfetiPalettes, KonfetiPresets, loadImage, VERSION } from "konfeti";
import type {
  FireInput,
  KonfetiEmitter,
  KonfetiHandle,
  KonfetiInstance,
  KonfetiPaletteName,
} from "konfeti";
import { createWorker, WorkerKonfetiInstance } from "konfeti/worker";
import type { WorkerEmitOptions, WorkerFireInput, WorkerStats } from "konfeti/worker";

import { startAnalytics } from "./analytics";
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
import { toCode } from "./share/codeExport";
import { createShareLink, readShareLink } from "./share/shareLink";

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
 * Stat Elements Fed Only by Hooks (unavailable in worker mode; the others come from `getStats()` there).
 */
const HOOK_STATS = ["stat-updated"] as const;

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

  return useWorker ? createWorker(canvas) : KonfetiFactory.create(canvas);
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
  // worker counters are cumulative per instance; Reset remembers where they stood
  const noStats: WorkerStats = { live: 0, spawned: 0, died: 0, completed: 0 };
  let statsBase = noStats;
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

      // a worker rejects invalid options asynchronously, so report them when the handle settles
      if (main instanceof WorkerKonfetiInstance) {
        handle.then(undefined, (error: unknown) => {
          showToast(error instanceof Error ? error.message : String(error), true);
        });
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
  // assigned once the export tab is wired up (below); settings changes call it to keep link and code live
  let refreshExport = (): void => undefined;

  const controls = renderControls(
    byId("controls", HTMLElement),
    localizeSections(CONTROL_SECTIONS),
    state,
    (key) => {
      // picking a theme fills the palette with its colors (a normal, editable palette afterwards)
      if (key === "colorTheme") {
        const theme = str(state, "colorTheme").toUpperCase().replace(/ /g, "_");

        if (theme in KonfetiPalettes) {
          controls.setValue("colors", [...KonfetiPalettes[theme as KonfetiPaletteName]]);
        }
      }

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
      restartStream();
      refreshExport();
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
    statsBase = main instanceof WorkerKonfetiInstance ? main.getStats() : noStats;
    eventLog.replaceChildren();
  });

  // presets gallery
  renderPresets(byId("presets", HTMLElement), (name) => {
    fireMain(KonfetiPresets[name]);
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
      // click bursts become the "last burst" too, so pause / resume / stop and the status chip follow them
      const track = (handle: KonfetiHandle): void => {
        lastHandle = handle;
      };
      // worker stages get plain options (see fireOn); main-thread stages also run the hooks
      unsubscribeClick =
        main instanceof WorkerKonfetiInstance
          ? main.onClick(stageHit, () => clickOptions() as WorkerFireInput, { onFire: track })
          : main.onClick(stageHit, () => withHooks(clickOptions()), { onFire: track });
    }
  };
  clickToggle.addEventListener("change", applyClickToggle);
  applyClickToggle();

  // pointer stream (emit): Particle Count is the rate; settings changes restart it so tuning is live
  const streamToggle = byId("pointer-stream", HTMLInputElement);
  let stream: KonfetiEmitter | null = null;
  const startStream = (): void => {
    // emit() replaces particleCount / emission / origin itself, so the fire options pass through as they are
    const options = buildOptions(state, assets, { includeOrigin: false });
    const settings = {
      ...options,
      rate: Math.max(1, options.particleCount ?? 60),
      follow: "pointer" as const,
    };

    try {
      // worker stages get worker-safe options (no hooks); main-thread stages also run the hooks
      stream =
        main instanceof WorkerKonfetiInstance
          ? main.emit(settings as WorkerEmitOptions)
          : main.emit({ ...settings, ...buildHooks(state, counters, logEvent) });
    } catch (error) {
      streamToggle.checked = false;
      showToast(error instanceof Error ? error.message : String(error), true);
    }
  };
  function restartStream(): void {
    stream?.stop();
    stream = null;

    if (streamToggle.checked) {
      startStream();
    }
  }
  streamToggle.addEventListener("change", restartStream);

  // worker mode (createWorker from konfeti/worker)
  const workerToggle = byId("worker-mode", HTMLInputElement);
  workerToggle.addEventListener("change", () => {
    stream = null;
    main.destroy();
    main = createStage(workerToggle.checked);
    lastHandle = null;
    statsBase = noStats;
    applyClickToggle();
    restartStream();

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
    // hooks never run inside a worker: there the counters come from getStats() (minus the last reset)
    if (main instanceof WorkerKonfetiInstance) {
      const stats = main.getStats();
      labels.spawned.textContent = COMPACT.format(stats.spawned - statsBase.spawned);
      labels.died.textContent = COMPACT.format(stats.died - statsBase.died);
      labels.completed.textContent = COMPACT.format(stats.completed - statsBase.completed);
      labels.updated.textContent = NO_VALUE;
    } else {
      labels.spawned.textContent = COMPACT.format(counters.spawned);
      labels.died.textContent = COMPACT.format(counters.died);
      labels.completed.textContent = COMPACT.format(counters.completed);
      labels.updated.textContent = COMPACT.format(counters.updated);
    }

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

  // defaults before a shared link is applied: Copy Code writes only what differs from these
  const defaultOptions = buildOptions({ ...state }, assets);

  // share link: only settings that differ from the defaults travel in the URL
  const shared = readShareLink();

  if (shared !== null) {
    controls.restore(shared);
    showToast(t("share.loaded"));
  }

  const copyText = (text: string, done: string): void => {
    navigator.clipboard.writeText(text).then(
      () => {
        showToast(done);
      },
      () => {
        showToast(t("clipboard.unavailable"), true);
      },
    );
  };
  const shareLink = byId("share-link", HTMLInputElement);
  const codePreview = byId("code-preview", HTMLElement);
  const exportTab = byId("tab-export", HTMLElement);
  let codeMode: "changed" | "all" = "changed";
  const currentCode = (): string =>
    toCode(buildOptions(state, assets), codeMode === "all" ? null : defaultOptions, assets);
  const modeButtons = [...document.querySelectorAll<HTMLButtonElement>(".code-mode-option")];

  for (const button of modeButtons) {
    button.addEventListener("click", () => {
      codeMode = button.dataset["mode"] === "all" ? "all" : "changed";

      for (const other of modeButtons) {
        other.setAttribute("aria-pressed", String(other === button));
      }

      refreshExport();
    });
  }

  // the export tab shows the live link and code; skipped while it is hidden
  refreshExport = (): void => {
    if (exportTab.hidden) {
      return;
    }

    shareLink.value = createShareLink(controls.snapshot());
    codePreview.textContent = currentCode();
  };

  byId("share", HTMLButtonElement).addEventListener("click", () => {
    const link = createShareLink(controls.snapshot());
    // the address bar shows the link too, so a reload keeps the settings
    history.replaceState(history.state, "", link);
    copyText(link, t("share.copied"));
  });
  shareLink.addEventListener("focus", () => {
    shareLink.select();
  });
  byId("copy-code", HTMLButtonElement).addEventListener("click", () => {
    copyText(currentCode(), t("code.copied"));
  });

  // panel tabs: controls / share & export
  const tabs = [...document.querySelectorAll<HTMLButtonElement>(".panel-tab")];
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const other of tabs) {
        const selected = other === tab;
        other.setAttribute("aria-selected", String(selected));
        byId(`tab-${other.dataset["tab"] ?? ""}`, HTMLElement).hidden = !selected;
      }

      document.querySelector(".panel")?.scrollTo({ top: 0 });
      refreshExport();
    });
  }

  syncJson(true);
  requestAnimationFrame(tick);
}

startAnalytics();
void init();
