import { getLocale } from "./Locale";
import type { Locale } from "./Locale";

/**
 * English UI Strings (the source language; every other language must cover each key).
 */
const EN = {
  // shared chrome
  "nav.site": "Site",
  "nav.playground": "Playground",
  "nav.docs": "Docs",
  "nav.api": "API",
  "lang.label": "Language",
  "clipboard.unavailable": "Clipboard unavailable",

  // playground
  "playground.title": "konfeti — canvas confetti playground",
  "playground.tag": "canvas confetti",
  "status.idle": "idle",
  "status.running": "running",
  "status.paused": "paused",
  "status.finished": "finished",
  "stats.label": "Live stats",
  "stats.live": "Live",
  "stats.fps": "FPS",
  "stats.spawned": "Spawned",
  "stats.died": "Died",
  "stats.done": "Done",
  "stats.updates": "Updates",
  "stats.hooksOnly":
    "Counted by hooks, which only run on the main thread — unavailable in worker mode",
  "tools.clickToFire": "Click to Fire",
  "tools.workerMode": "Worker Mode",
  "tools.workerModeTitle": "KonfetiFactory.createWorker(canvas) — renders in a Web Worker",
  "hooks.log": "Hook Events",
  "stage.hintBefore": "Click the stage or press",
  "stage.hintAfter": "",
  "actions.fire": "Fire",
  "actions.fireTitle": "Fire (F)",
  "actions.lastBurst": "Last burst",
  "actions.pause": "Pause last burst",
  "actions.resume": "Resume last burst",
  "actions.stop": "Stop last burst",
  "actions.reset": "Reset",
  "actions.resetTitle": "Clear every particle and counter",
  "block.presets": "Presets",
  "block.options": "Options",
  "block.resetControls": "Reset Controls",
  "json.title": "Options JSON",
  "json.synced": "synced with controls",
  "json.edited": "edited — controls no longer sync",
  "json.description":
    'Functions and elements are omitted. <code>"$asset:…"</code> placeholders stand for the demo canvases. Arrays fire several bursts at once.',
  "json.fire": "Fire JSON",
  "json.copy": "Copy",
  "json.sync": "Sync from Controls",
  "json.copied": "JSON copied to clipboard",
  "image.loaded": "Image loaded · {width}×{height}",
  "image.failed": "Image failed to load",
  "worker.unsupported": "OffscreenCanvas unsupported — running on the main thread",
  "worker.enabled": "Worker mode · hooks stay on the main thread, so the hook log pauses",
  "palette.add": "Add color",
  "palette.addTo": "Add color to {label}",
  "palette.remove": "Remove color",
  "palette.removeHex": "Remove {hex}",
  "file.none": "No file chosen",
  "file.choose": "Choose…",
  "hint.label": "About {label}",

  // docs
  "docs.title": "konfeti — docs",
  "docs.tag": "docs",
  "docs.guide": "Guide",
  "docs.guideSections": "Guide sections",
  "docs.reference": "Reference",
  "docs.apiReference": "API reference ↗",
  "docs.playgroundLink": "Playground ↗",
  "docs.run": "▶ Run",
  "docs.copy": "Copy",
  "docs.copied": "Copied",
} as const satisfies Readonly<Record<string, string>>;

/**
 * Translatable UI String Key.
 */
export type MessageKey = keyof typeof EN;

/**
 * Turkish UI Strings.
 */
const TR: Readonly<Record<MessageKey, string>> = {
  "nav.site": "Site",
  "nav.playground": "Deneme Alanı",
  "nav.docs": "Dokümanlar",
  "nav.api": "API",
  "lang.label": "Dil",
  "clipboard.unavailable": "Panoya erişilemiyor",

  "playground.title": "konfeti — canvas konfeti deneme alanı",
  "playground.tag": "canvas konfeti",
  "status.idle": "boşta",
  "status.running": "çalışıyor",
  "status.paused": "duraklatıldı",
  "status.finished": "bitti",
  "stats.label": "Canlı istatistikler",
  "stats.live": "Canlı",
  "stats.fps": "FPS",
  "stats.spawned": "Doğan",
  "stats.died": "Ölen",
  "stats.done": "Biten",
  "stats.updates": "Güncelleme",
  "stats.hooksOnly":
    "Hook'larla sayılır; hook'lar yalnızca ana thread'de çalışır — worker modunda yok",
  "tools.clickToFire": "Tıkla, Patlat",
  "tools.workerMode": "Worker Modu",
  "tools.workerModeTitle": "KonfetiFactory.createWorker(canvas) — Web Worker içinde çizer",
  "hooks.log": "Hook Olayları",
  "stage.hintBefore": "Sahneye tıkla ya da",
  "stage.hintAfter": "tuşuna bas",
  "actions.fire": "Patlat",
  "actions.fireTitle": "Patlat (F)",
  "actions.lastBurst": "Son patlama",
  "actions.pause": "Son patlamayı duraklat",
  "actions.resume": "Son patlamayı sürdür",
  "actions.stop": "Son patlamayı durdur",
  "actions.reset": "Sıfırla",
  "actions.resetTitle": "Tüm parçacıkları ve sayaçları temizle",
  "block.presets": "Hazır Ayarlar",
  "block.options": "Seçenekler",
  "block.resetControls": "Kontrolleri Sıfırla",
  "json.title": "Seçenekler JSON",
  "json.synced": "kontrollerle eşit",
  "json.edited": "düzenlendi — kontrollerle artık eşitlenmiyor",
  "json.description":
    'Fonksiyonlar ve elementler dahil edilmez. <code>"$asset:…"</code> yer tutucuları demo canvas\'larını temsil eder. Dizi verirsen birden çok patlama aynı anda atılır.',
  "json.fire": "JSON'u Patlat",
  "json.copy": "Kopyala",
  "json.sync": "Kontrollerden Eşitle",
  "json.copied": "JSON panoya kopyalandı",
  "image.loaded": "Görsel yüklendi · {width}×{height}",
  "image.failed": "Görsel yüklenemedi",
  "worker.unsupported": "OffscreenCanvas desteklenmiyor — ana thread'de çalışıyor",
  "worker.enabled": "Worker modu · hook'lar ana thread'de kalır, bu yüzden hook kaydı durur",
  "palette.add": "Renk ekle",
  "palette.addTo": "{label} listesine renk ekle",
  "palette.remove": "Rengi kaldır",
  "palette.removeHex": "{hex} rengini kaldır",
  "file.none": "Dosya seçilmedi",
  "file.choose": "Seç…",
  "hint.label": "{label} hakkında",

  "docs.title": "konfeti — dokümanlar",
  "docs.tag": "dokümanlar",
  "docs.guide": "Rehber",
  "docs.guideSections": "Rehber bölümleri",
  "docs.reference": "Referans",
  "docs.apiReference": "API referansı (EN) ↗",
  "docs.playgroundLink": "Deneme Alanı ↗",
  "docs.run": "▶ Çalıştır",
  "docs.copy": "Kopyala",
  "docs.copied": "Kopyalandı",
};

/**
 * Dictionaries by Language.
 */
const MESSAGES: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> = { en: EN, tr: TR };

/**
 * Check Whether a String Is a Message Key (for `data-i18n` attributes).
 *
 * @param key - Candidate
 * @returns Key Flag
 */
export function isMessageKey(key: string): key is MessageKey {
  return key in EN;
}

/**
 * Translate UI String into the Active Language.
 *
 * @param key - Message Key
 * @param params - Values for `{name}` Placeholders
 * @returns Translated Text
 */
export function t(key: MessageKey, params: Readonly<Record<string, string | number>> = {}): string {
  return MESSAGES[getLocale()][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
