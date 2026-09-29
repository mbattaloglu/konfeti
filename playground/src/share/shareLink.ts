/**
 * URL Query Parameter Holding Shared Settings.
 */
const PARAM = "s";

/**
 * Encode Text as Base64url (UTF-8, so emoji and Turkish text survive).
 *
 * @param text - Text
 * @returns URL-Safe Base64 without Padding
 */
function toBase64Url(text: string): string {
  let binary = "";

  for (const byte of new TextEncoder().encode(text)) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode Base64url Back to Text.
 *
 * @param encoded - URL-Safe Base64
 * @returns Text
 * @throws Error for malformed input
 */
function fromBase64Url(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/**
 * Build a Link to This Page Carrying the Given Settings.
 * The language parameter is dropped, so the link opens in the receiver's own language.
 *
 * @param values - Changed Control Values
 * @returns Absolute URL
 */
export function createShareLink(values: Readonly<Record<string, unknown>>): string {
  const url = new URL(location.href);
  url.hash = "";
  url.searchParams.delete("lang");

  if (Object.keys(values).length === 0) {
    url.searchParams.delete(PARAM);
  } else {
    url.searchParams.set(PARAM, toBase64Url(JSON.stringify(values)));
  }

  return url.href;
}

/**
 * Read Shared Settings from the Current URL.
 * A broken or foreign value is ignored rather than failing the page.
 *
 * @returns Settings, or Null when the URL Carries None
 */
export function readShareLink(): Readonly<Record<string, unknown>> | null {
  const encoded = new URLSearchParams(location.search).get(PARAM);

  if (encoded === null || encoded === "") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    // outside input: keep only plain entries; each control checks the value's type again on restore
    return Object.fromEntries(Object.entries(parsed));
  } catch {
    return null;
  }
}
