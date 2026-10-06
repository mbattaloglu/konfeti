import { VERSION } from "konfeti";

import readmeEn from "../../../packages/konfeti/README.md?raw";
import readmeTr from "../../../packages/konfeti/README.tr.md?raw";
import { startAnalytics } from "../analytics";
import { getLocale } from "../i18n/Locale";
import type { Locale } from "../i18n/Locale";
import { t } from "../i18n/messages";
import { applyStaticText, mountLanguageSwitch } from "../i18n/staticText";
import { byId } from "../ui/dom";
import { PRERENDERED_LOCALE, renderGuide } from "./guideRenderer";
import { runExample } from "./runExample";

/**
 * Guide Source by Language (the package README and its Turkish translation).
 */
const READMES: Readonly<Record<Locale, string>> = { en: readmeEn, tr: readmeTr };

/**
 * Toast Visibility Duration.
 */
const TOAST_MS = 2200;

/**
 * Root Class that Hides the Guide until It Shows the Page's Language (set by an inline script in the page head).
 */
const PENDING_CLASS = "guide-pending";

/**
 * Wire Up the Docs Page.
 */
function init(): void {
  const content = byId("docs-content", HTMLElement);
  const toc = byId("docs-toc", HTMLElement);
  const toast = byId("toast", HTMLElement);
  applyStaticText(document, "docs.title");
  mountLanguageSwitch(byId("lang-switch", HTMLElement));
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

  // the built page already carries the English guide; anything else is rendered here
  if (!(getLocale() === PRERENDERED_LOCALE && content.querySelector(".docs-section") !== null)) {
    const guide = renderGuide(READMES[getLocale()], { run: t("docs.run"), copy: t("docs.copy") });
    content.innerHTML = guide.content;
    toc.innerHTML = guide.toc;
  }

  document.documentElement.classList.remove(PENDING_CLASS);

  // copy / run buttons on every code block
  content.addEventListener("click", (event) => {
    const button =
      event.target instanceof Element ? event.target.closest("button[data-action]") : null;
    const figure = button?.closest("figure.code");

    if (!(button instanceof HTMLButtonElement) || !(figure instanceof HTMLElement)) {
      return;
    }

    const source = figure.dataset["source"] ?? "";

    if (button.dataset["action"] === "copy") {
      navigator.clipboard.writeText(source).then(
        () => {
          showToast(t("docs.copied"));
        },
        () => {
          showToast(t("clipboard.unavailable"), true);
        },
      );
      return;
    }

    runExample(source).catch((error: unknown) => {
      showToast(error instanceof Error ? error.message : String(error), true);
    });
  });

  // highlight the section currently in view
  const links = [...toc.querySelectorAll<HTMLAnchorElement>("a[data-section]")];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace(/^section-/, "");
          for (const link of links) {
            link.classList.toggle("is-active", link.dataset["section"] === id);
          }
        }
      }
    },
    { rootMargin: "-20% 0px -70% 0px" },
  );

  for (const block of content.querySelectorAll(".docs-section")) {
    observer.observe(block);
  }

  // honour a deep link after the content exists
  if (location.hash !== "") {
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
}

startAnalytics();
init();
