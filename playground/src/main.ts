import { KonfetiFactory, KonfetiPalettes, KonfetiPresets, loadImage, VERSION } from "konfeti";
import type {
  CreateOptions,
  FireInput,
  FireOptions,
  KonfetiEmitter,
  KonfetiHandle,
  KonfetiInstance,
  KonfetiPaletteName,
} from "konfeti";
import { createWorker, WorkerKonfetiInstance } from "konfeti/worker";
import type { WorkerEmitOptions, WorkerFireInput, WorkerStats } from "konfeti/worker";

import { startAnalytics } from "./analytics";
import { buildBurst, buildInput } from "./buildOptions";
import { CONTROL_SECTIONS } from "./controls";
import type { ControlState } from "./controlTypes";
import { createDemoAssets } from "./demoAssets";
import { CONTROL_INDEX, deriveTheme, initialBurst } from "./editor/burstState";
import type { BurstState } from "./editor/burstState";
import { countHiddenAdvanced } from "./editor/editorMode";
import { createOverrideSource } from "./editor/overrides";
import { buildHooks, createCounters } from "./hooks";
import { t } from "./i18n/messages";
import { localizeSections } from "./i18n/localizeControls";
import { applyStaticText, mountLanguageSwitch } from "./i18n/staticText";
import { isBurstList, parseJson, toJson } from "./jsonIO";
import { list, raw, str } from "./stateReaders";
import { byId, el } from "./ui/dom";
import { renderControls } from "./ui/renderControls";
import { renderModeSwitch } from "./ui/renderModeSwitch";
import { renderPresets } from "./ui/renderPresets";
import { toCode } from "./share/codeExport";
import type { CodeMode } from "./share/codeExport";
import {
  createShareLink,
  isShareable,
  MAX_SHARE_URL_LENGTH,
  readShareLink,
  restoreShared,
  toShareSettings,
} from "./share/shareLink";
import type { ShareV2 } from "./share/shareLink";

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
 * Text Controls Holding a Typed Image Address (checked after each committed change).
 */
const URL_KEYS: readonly string[] = ["image.url", "sprite.url", "formationImageUrl"];

/**
 * How Long the Address Check Waits for an Image before It Reports a Failure.
 */
const URL_CHECK_TIMEOUT_MS = 10_000;

/**
 * Start of Inline SVG Markup, Which Is Not an Address.
 */
const SVG_MARKUP_START = "<svg";

/**
 * Check Whether a Typed Image Address Loads, Requested the Way the Library Requests It.
 * A fresh image every time: the library caches a failed image, and a cached failure never reports again.
 *
 * @param url - Address as Typed
 * @returns Resolves with the Loaded Flag (false after an error or the timeout)
 */
function imageLoads(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      resolve(false);
    }, URL_CHECK_TIMEOUT_MS);
    const finish = (loaded: boolean): void => {
      window.clearTimeout(timer);
      resolve(loaded);
    };

    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => {
      finish(true);
    });
    image.addEventListener("error", () => {
      finish(false);
    });
    image.src = url;
  });
}

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
 * Stage Switches Passed to the Instance.
 */
type StageOptions = Pick<CreateOptions, "fixedTimestep" | "adaptiveQuality">;

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
 * @param options - Stage Switches (fixed time step, adaptive quality)
 * @returns Stage Instance
 */
function createStage(useWorker: boolean, options: StageOptions): Stage {
  const previous = byId("stage-canvas", HTMLCanvasElement);
  const canvas = el("canvas", "stage-canvas");
  canvas.id = previous.id;
  canvas.setAttribute("aria-hidden", "true");
  previous.replaceWith(canvas);

  return useWorker ? createWorker(canvas, options) : KonfetiFactory.create(canvas, options);
}

/**
 * Give Every Entry of a Burst List Its Own Seed, so the List Can Be Replayed Exactly.
 * A single burst keeps its options: its handle reports the seed it picked.
 *
 * @param input - Fire Input
 * @returns Fire Input with Seeded List Entries
 */
function seedList(input: FireInput): FireInput {
  return isBurstList(input)
    ? input.map((entry) =>
        entry.seed === undefined ? { ...entry, seed: Math.floor(Math.random() * 2 ** 32) } : entry,
      )
    : input;
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
  // the remembered editor mode is applied before the demo assets load, so the panel never shows the other mode
  const modeRoot = byId("tab-controls", HTMLElement);
  const modeSwitch = renderModeSwitch(
    byId("editor-mode", HTMLElement),
    byId("mode-badge", HTMLElement),
  );
  modeRoot.dataset["mode"] = modeSwitch.mode();
  const assets = await createDemoAssets();
  const state: ControlState = {};
  const counters = createCounters();
  // the stage is a regular canvas element, so the whole playground is a KonfetiFactory.create(canvas) demo
  let main: Stage = createStage(false, {});
  const jsonArea = byId("json", HTMLTextAreaElement);
  const jsonState = byId("json-state", HTMLElement);
  const toast = byId("toast", HTMLElement);
  const eventLog = byId("event-log", HTMLOListElement);
  const statusChip = byId("status", HTMLElement);
  const statusText = byId("status-text", HTMLElement);
  const stageHit = byId("stage-hit", HTMLElement);
  let lastHandle: KonfetiHandle | null = null;
  // what the last burst was fired with, for the replay button
  let lastInput: FireInput | null = null;
  const replayButton = byId("replay", HTMLButtonElement);
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

  const remember = (input: FireInput, handle: KonfetiHandle): void => {
    lastHandle = handle;
    lastInput = input;
    replayButton.title = t("actions.replaySeed", { seed: handle.getSeed() });
  };

  const fireMain = (input: FireInput): void => {
    try {
      const seeded = seedList(input);
      const handle = fireOn(main, seeded, withHooks);
      remember(seeded, handle);

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

    // the minimal build: exactly what Fire sends
    jsonArea.value = toJson(buildInput(currentBursts(), assets), assets);
    jsonDirty = false;
    jsonState.textContent = t("json.synced");
    jsonState.classList.remove("is-dirty");
  };

  // declarative controls
  // assigned once the export tab is wired up (below); settings changes call it to keep link and code live
  let refreshExport = (): void => undefined;

  const sections = localizeSections(CONTROL_SECTIONS);
  const controls = renderControls(
    byId("controls", HTMLElement),
    sections,
    state,
    (key) => {
      // picking a theme fills the palette with its colors (a normal, editable palette afterwards); that write
      // runs this listener for "colors", which already refreshed everything
      if (key === "colorTheme") {
        const theme = str(state, "colorTheme").toUpperCase().replace(/ /g, "_");

        if (theme in KonfetiPalettes) {
          controls.setValue("colors", [...KonfetiPalettes[theme as KonfetiPaletteName]]);
          return;
        }
      }

      // the theme only names the palette the colors match ("custom" for any other list)
      if (key === "colors") {
        controls.setValue("colorTheme", deriveTheme(list(state, "colors")), { silent: true });
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

      if (URL_KEYS.includes(key)) {
        const url = raw(state, key);

        // a blank field means "not set"; markup is not an address (the library turns it into a data: URL)
        if (url.trim() !== "" && !url.trimStart().startsWith(SVG_MARKUP_START)) {
          void imageLoads(url).then((loaded) => {
            // always this text: an error message would be English and could hold a data: URL of any length
            if (!loaded) {
              showToast(t("image.failed"), true);
            }
          });
        }
      }

      syncJson();
      restartStream();
      refreshExport();
      refreshBadge();
    },
    { mode: modeSwitch.mode(), modeRoot, overrides: createOverrideSource(sections, state) },
  );

  /**
   * List Every Burst of the Editor (one burst, the live controls).
   *
   * @returns Burst States in Tab Order
   */
  function currentBursts(): readonly BurstState[] {
    return [controls.capture("burst")];
  }

  /**
   * Count the Active Settings Basic Mode Hides, for the Badge on the Advanced Button.
   */
  function refreshBadge(): void {
    modeSwitch.setHiddenCount(
      countHiddenAdvanced(currentBursts(), controls.capture("global"), CONTROL_INDEX),
    );
  }

  modeSwitch.onChange((mode) => {
    controls.setMode(mode);
    refreshBadge();
  });

  // every binding of both scopes goes back to its initial value (the library defaults)
  byId("reset-controls", HTMLButtonElement).addEventListener("click", () => {
    controls.reset();
    syncJson(true);
  });

  // top bar
  byId("fire", HTMLButtonElement).addEventListener("click", () => {
    fireMain(buildInput(currentBursts(), assets));
  });
  byId("pause", HTMLButtonElement).addEventListener("click", () => lastHandle?.pause());
  byId("resume", HTMLButtonElement).addEventListener("click", () => lastHandle?.resume());
  byId("stop", HTMLButtonElement).addEventListener("click", () => lastHandle?.stop());
  // the same options with the same seed: the same burst again (exactly so with Fixed Step on)
  replayButton.addEventListener("click", () => {
    if (lastInput !== null && lastHandle !== null) {
      fireMain(isBurstList(lastInput) ? lastInput : { ...lastInput, seed: lastHandle.getSeed() });
    }
  });
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
      const clickOptions = (): FireOptions => buildBurst(state, assets, { includeOrigin: false });
      // click bursts become the "last burst" too, so pause / resume / stop / replay and the status chip follow
      // them; the replay fires at the same spot
      const track = (handle: KonfetiHandle, event: MouseEvent): void => {
        const origin = { clientX: event.clientX, clientY: event.clientY };
        remember({ ...clickOptions(), origin }, handle);
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
    // emit() replaces particleCount / emission / origin itself, so the fire options pass through as they are;
    // a stream cannot form a shape
    const options = buildBurst(state, assets, { includeOrigin: false, includeFormation: false });
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

  // worker mode (createWorker from konfeti/worker) and fixed step (fixedTimestep) both need a new stage
  const workerToggle = byId("worker-mode", HTMLInputElement);
  const fixedStepToggle = byId("fixed-step", HTMLInputElement);
  const adaptiveToggle = byId("adaptive-quality", HTMLInputElement);
  const rebuildStage = (): void => {
    stream = null;
    main.destroy();
    main = createStage(workerToggle.checked, {
      fixedTimestep: fixedStepToggle.checked,
      adaptiveQuality: adaptiveToggle.checked,
    });
    lastHandle = null;
    lastInput = null;
    replayButton.title = t("actions.replay");
    statsBase = noStats;
    applyClickToggle();
    restartStream();
  };
  fixedStepToggle.addEventListener("change", rebuildStage);
  adaptiveToggle.addEventListener("change", rebuildStage);
  workerToggle.addEventListener("change", () => {
    rebuildStage();

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
      fireMain(buildInput(currentBursts(), assets));
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

  const qualityLevel = byId("quality-level", HTMLElement);

  const tick = (now: number): void => {
    frames++;

    if (now - lastSample >= FPS_SAMPLE_MS) {
      labels.fps.textContent = String(Math.round((frames * 1000) / (now - lastSample)));
      frames = 0;
      lastSample = now;
    }

    labels.live.textContent = COMPACT.format(main.getParticleCount());
    // the adaptive quality level: 0 full, 1 CSS resolution, 2 no effects, 3 fewer particles
    qualityLevel.textContent = adaptiveToggle.checked
      ? `adaptiveQuality · ${String(main.getQualityLevel())}`
      : "adaptiveQuality";
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

  // share link: only settings that differ from the defaults travel in the URL (upload URLs never do)
  const shareSettings = (): ShareV2 | null =>
    toShareSettings(currentBursts(), controls.capture("global"));
  const shared = readShareLink();

  if (shared !== null) {
    // a link is outside input: every value is checked against its control before it is shown, and a v1 link is
    // migrated to the v2 controls first
    const restored = restoreShared(shared);
    // one burst until the burst tabs arrive; a longer list can only come from a later deploy
    const [burst = initialBurst()] = restored.bursts;
    controls.load("burst", burst);
    controls.load("global", restored.globals);
    syncJson(true);
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
  const shareTooLong = byId("share-too-long", HTMLElement);
  // the link, or null when it is too long to open (the note under the link field says why)
  const shareableLink = (): string | null => {
    const link = createShareLink(shareSettings());
    const fits = isShareable(link);
    shareTooLong.hidden = fits;
    shareTooLong.textContent = fits
      ? ""
      : t("share.tooLong", { length: link.length, limit: MAX_SHARE_URL_LENGTH });

    return fits ? link : null;
  };
  const codePreview = byId("code-preview", HTMLElement);
  const exportTab = byId("tab-export", HTMLElement);
  let codeMode: CodeMode = "changed";
  // "Changed only" is the minimal build (what differs from the library defaults), "All settings" the explicit one
  const currentCode = (): string =>
    toCode(
      buildInput(currentBursts(), assets, { mode: codeMode === "all" ? "explicit" : "minimal" }),
      assets,
      codeMode,
    );
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

    shareLink.value = shareableLink() ?? "";
    codePreview.textContent = currentCode();
  };

  byId("share", HTMLButtonElement).addEventListener("click", () => {
    const link = shareableLink();

    // a link that cannot open is not copied, and the address bar keeps what it has
    if (link === null) {
      showToast(shareTooLong.textContent, true);
      return;
    }

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
