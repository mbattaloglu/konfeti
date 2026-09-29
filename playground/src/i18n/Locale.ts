/**
 * Site Language.
 */
export type Locale = "en" | "tr";

/**
 * Every Supported Language, in Switcher Order.
 */
export const LOCALES: readonly Locale[] = ["en", "tr"];

/**
 * Storage Key of the Picked Language.
 */
const STORAGE_KEY = "konfeti.locale";

/**
 * URL Query Parameter that Picks the Language (`?lang=tr`).
 */
const QUERY_PARAM = "lang";

/**
 * Resolved Language (cached after the first lookup).
 */
let current: Locale | null = null;

/**
 * Check Whether a Value Is a Supported Language.
 *
 * @param value - Candidate
 * @returns Supported Flag
 */
function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

/**
 * Read Stored Language (storage can be blocked, e.g. private windows).
 *
 * @returns Stored Language or Null
 */
function readStored(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Store Picked Language.
 *
 * @param locale - Language
 * @returns Whether It Was Stored
 */
function writeStored(locale: Locale): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect Language from the Browser Settings.
 *
 * @returns Turkish for Turkish Browsers, English Otherwise
 */
function detect(): Locale {
  return navigator.languages.some((language) => language.toLowerCase().startsWith("tr"))
    ? "tr"
    : "en";
}

/**
 * Return Active Language.
 * Order: `?lang=` in the URL (a shared link), then the stored pick, then the browser language.
 *
 * @returns Language
 */
export function getLocale(): Locale {
  if (current === null) {
    const fromQuery = new URLSearchParams(location.search).get(QUERY_PARAM);
    current = isLocale(fromQuery) ? fromQuery : (readStored() ?? detect());
  }

  return current;
}

/**
 * Switch Language and Reload the Page in It.
 *
 * @param locale - New Language
 */
export function switchLocale(locale: Locale): void {
  const url = new URL(location.href);

  // a stored pick keeps URLs clean; without storage the pick has to travel in the URL
  if (writeStored(locale)) {
    url.searchParams.delete(QUERY_PARAM);
  } else {
    url.searchParams.set(QUERY_PARAM, locale);
  }

  location.replace(url);
}

/**
 * Build a Link to the Same Page in Another Language.
 *
 * @param href - Target URL (relative to the current page)
 * @param locale - Language
 * @returns URL with `?lang=`
 */
export function localizedHref(href: string, locale: Locale): string {
  const url = new URL(href, location.href);
  url.searchParams.set(QUERY_PARAM, locale);
  return url.pathname + url.search + url.hash;
}
