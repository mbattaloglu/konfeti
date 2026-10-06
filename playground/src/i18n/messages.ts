import { getLocale } from "./Locale.ts";
import type { Locale } from "./Locale.ts";

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
  "tools.workerModeTitle": "createWorker(canvas) from konfeti/worker — renders in a Web Worker",
  "tools.pointerStream": "Pointer Stream",
  "tools.fixedStep": "Fixed Step",
  "tools.adaptive": "Adaptive Quality",
  "tools.adaptiveTitle":
    "adaptiveQuality: on a slow device, render at CSS resolution, then drop effects, then particles",
  "tools.fixedStepTitle":
    "fixedTimestep: simulate in 1/60 s steps, so a replay with the same seed is exact on any display",
  "tools.pointerStreamTitle":
    'emit({ rate, follow: "pointer" }) — Particle Count becomes particles per second',
  "hooks.log": "Hook Events",
  "hooks.empty": "Fire something…",
  "stage.hintBefore": "Click the stage or press",
  "stage.hintAfter": "",
  "actions.fire": "Fire",
  "actions.fireTitle": "Fire (F)",
  "actions.lastBurst": "Last burst",
  "actions.pause": "Pause last burst",
  "actions.resume": "Resume last burst",
  "actions.stop": "Stop last burst",
  "actions.replay": "Replay last burst (same seed)",
  "actions.replaySeed": "Replay last burst (seed {seed})",
  "actions.reset": "Reset",
  "actions.resetTitle": "Clear every particle and counter",
  "block.presets": "Presets",
  "block.options": "Options",
  "block.resetControls": "Reset Controls",
  "json.title": "Options JSON",
  "json.synced": "synced with controls",
  "json.edited": "edited — controls no longer sync",
  "json.description":
    'Functions and elements are omitted. <code>"$asset:…"</code> placeholders stand for the demo canvases. Arrays fire several bursts at once; Load into Controls turns them into burst tabs.',
  "json.fire": "Fire JSON",
  "json.copy": "Copy",
  "json.sync": "Sync from Controls",
  "json.copied": "JSON copied to clipboard",
  "json.load": "Load into Controls",
  "json.loaded": "JSON loaded into the controls",
  "load.issues": "Not loaded: {paths}",
  "preset.label": "Preset",
  "preset.edited": "edited",
  "preset.clear": "Clear the preset and reset the controls",
  "preset.add": "Add {name} as a new burst",
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
  "value.edit": "Edit {label}",
  "span.min": "{label} minimum",
  "span.max": "{label} maximum",
  "mode.label": "Editor mode",
  "mode.basic": "Basic",
  "mode.advanced": "Advanced",
  "mode.hidden": "{count} active settings are hidden in Basic",
  "mode.hiddenOne": "{count} active setting is hidden in Basic",
  "bursts.label": "Bursts",
  "bursts.tab": "Burst {n}",
  "bursts.add": "Add burst",
  "bursts.duplicate": "Duplicate burst",
  "bursts.remove": "Remove burst",
  "bursts.full": "No room for another burst ({max} at most)",
  "bursts.trimmed": "Added {count} of the preset's bursts: {max} at most",
  "style.heading": "Own Style",
  "style.add": "Add style…",
  "style.addLabel": "Add a style setting to {card}",
  "style.addButton": "Add",
  "style.remove": "Remove {style}",
  "shapes.paperOnly": "paper only",
  "shapes.enabled": "{count} on",
  "tabs.label": "Panel",
  "tabs.controls": "Controls",
  "tabs.stage": "Stage",
  "tabs.export": "Share & Export",
  "stage.description":
    "How the playground's own stage runs. These switch the stage, not the options you fire.",
  "share.heading": "Share Link",
  "share.description":
    "Only settings that differ from the defaults travel in the link (every burst; image URLs too, uploaded files stay here). It opens in the receiver's language.",
  "share.button": "Copy",
  "share.title": "Copy a link that opens the playground with these settings",
  "share.copied": "Link copied — it opens the playground with these settings",
  "share.loaded": "Settings loaded from the link",
  "share.tooLong":
    "This link is too long to open ({length} characters, about {limit} work). A large data: URL is the usual cause: use an http(s) image URL instead.",
  "code.heading": "Code",
  "code.description":
    "Ready to paste: only the settings that differ from the library defaults, or every setting written out. For an instance created with its own defaults, use All settings.",
  "code.modeChanged": "Non-defaults",
  "code.modeAll": "All settings",
  "code.commentAll": "every setting written out",
  "code.copy": "Copy Code",
  "code.commentChanged": "only settings that differ from the library defaults",
  "code.commentPreset": "the built-in preset, unchanged",
  "code.commentDefaults": "all defaults",
  "code.commentImages":
    "demo images are shown as placeholder paths: use your own URL, data: URI or image element",
  "code.title": "Copy the current settings as a Konfeti.fire() TypeScript snippet",
  "code.copied": "Code copied to clipboard",

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
  "tools.workerModeTitle": "konfeti/worker içinden createWorker(canvas) — Web Worker içinde çizer",
  "tools.pointerStream": "İmleçten Akış",
  "tools.fixedStep": "Sabit Adım",
  "tools.adaptive": "Uyarlanabilir Kalite",
  "tools.adaptiveTitle":
    "adaptiveQuality: yavaş cihazda önce CSS çözünürlüğüne iner, sonra efektleri, sonra parçacıkları azaltır",
  "tools.fixedStepTitle":
    "fixedTimestep: 1/60 sn'lik adımlarla simüle eder; aynı seed'le tekrar her ekranda birebir aynı olur",
  "tools.pointerStreamTitle":
    'emit({ rate, follow: "pointer" }) — Parçacık Sayısı saniyedeki parçacık olur',
  "hooks.log": "Hook Olayları",
  "hooks.empty": "Bir şey patlat…",
  "stage.hintBefore": "Sahneye tıkla ya da",
  "stage.hintAfter": "tuşuna bas",
  "actions.fire": "Patlat",
  "actions.fireTitle": "Patlat (F)",
  "actions.lastBurst": "Son patlama",
  "actions.pause": "Son patlamayı duraklat",
  "actions.resume": "Son patlamayı sürdür",
  "actions.stop": "Son patlamayı durdur",
  "actions.replay": "Son patlamayı tekrar oynat (aynı seed)",
  "actions.replaySeed": "Son patlamayı tekrar oynat (seed {seed})",
  "actions.reset": "Sıfırla",
  "actions.resetTitle": "Tüm parçacıkları ve sayaçları temizle",
  "block.presets": "Hazır Ayarlar",
  "block.options": "Seçenekler",
  "block.resetControls": "Kontrolleri Sıfırla",
  "json.title": "Seçenekler JSON",
  "json.synced": "kontrollerle eşit",
  "json.edited": "düzenlendi — kontrollerle artık eşitlenmiyor",
  "json.description":
    'Fonksiyonlar ve elementler dahil edilmez. <code>"$asset:…"</code> yer tutucuları demo canvas\'larını temsil eder. Dizi verirsen birden çok patlama aynı anda atılır; Kontrollere Yükle onları atış sekmelerine çevirir.',
  "json.fire": "JSON'u Patlat",
  "json.copy": "Kopyala",
  "json.sync": "Kontrollerden Eşitle",
  "json.copied": "JSON panoya kopyalandı",
  "json.load": "Kontrollere Yükle",
  "json.loaded": "JSON kontrollere yüklendi",
  "load.issues": "Yüklenemedi: {paths}",
  "preset.label": "Hazır Ayar",
  "preset.edited": "değiştirildi",
  "preset.clear": "Hazır ayarı temizle ve kontrolleri sıfırla",
  "preset.add": "{name} hazır ayarını yeni atış olarak ekle",
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
  "value.edit": "{label} değerini düzenle",
  "span.min": "{label} en düşük değeri",
  "span.max": "{label} en yüksek değeri",
  "mode.label": "Düzenleyici modu",
  "mode.basic": "Temel",
  "mode.advanced": "Gelişmiş",
  "mode.hidden": "Temel modda {count} etkin ayar gizli",
  "mode.hiddenOne": "Temel modda {count} etkin ayar gizli",
  "bursts.label": "Atışlar",
  "bursts.tab": "Atış {n}",
  "bursts.add": "Atış ekle",
  "bursts.duplicate": "Atışı çoğalt",
  "bursts.remove": "Atışı kaldır",
  "bursts.full": "Başka atışa yer yok (en çok {max})",
  "bursts.trimmed": "Hazır ayarın atışlarından {count} tanesi eklendi: en çok {max} olabilir",
  "style.heading": "Kendi Stili",
  "style.add": "Stil ekle…",
  "style.addLabel": "{card} için stil ayarı ekle",
  "style.addButton": "Ekle",
  "style.remove": "{style} ayarını kaldır",
  "shapes.paperOnly": "sadece kağıt",
  "shapes.enabled": "{count} açık",
  "tabs.label": "Panel",
  "tabs.controls": "Ayarlar",
  "tabs.stage": "Sahne",
  "tabs.export": "Paylaş ve Dışa Aktar",
  "stage.description":
    "Deneme alanının kendi sahnesinin nasıl çalıştığı. Bunlar atılan seçenekleri değil, sahneyi değiştirir.",
  "share.heading": "Paylaşım Bağlantısı",
  "share.description":
    "Bağlantıda yalnızca varsayılanlardan farklı ayarlar taşınır (tüm atışlar; görsel URL'leri de, yüklenen dosyalar burada kalır). Alıcının kendi dilinde açılır.",
  "share.button": "Kopyala",
  "share.title": "Deneme alanını bu ayarlarla açan bir bağlantı kopyala",
  "share.copied": "Bağlantı kopyalandı — deneme alanını bu ayarlarla açar",
  "share.loaded": "Ayarlar bağlantıdan yüklendi",
  "share.tooLong":
    "Bu bağlantı açılamayacak kadar uzun ({length} karakter, yaklaşık {limit} karaktere kadar açılır). Bunun genelde nedeni büyük bir data: URL'sidir: bunun yerine bir http(s) görsel URL'si kullan.",
  "code.heading": "Kod",
  "code.description":
    "Yapıştırmaya hazır: yalnızca kütüphane varsayılanlarından farklı ayarlar ya da tüm ayarlar açıkça. Kendi varsayılanlarıyla oluşturulmuş bir örnek için Tüm Ayarlar'ı kullan.",
  "code.modeChanged": "Varsayılan Dışı",
  "code.modeAll": "Tüm Ayarlar",
  "code.commentAll": "tüm ayarlar açıkça yazılı",
  "code.copy": "Kodu Kopyala",
  "code.commentChanged": "yalnızca kütüphane varsayılanlarından farklı ayarlar",
  "code.commentPreset": "hazır ayarın kendisi, değiştirilmeden",
  "code.commentDefaults": "tüm ayarlar varsayılan",
  "code.commentImages":
    "demo görseller yer tutucu yollarla gösterilir: kendi URL'ni, data: URI'ni ya da görsel elementini kullan",
  "code.title": "Geçerli ayarları Konfeti.fire() TypeScript kodu olarak kopyala",
  "code.copied": "Kod panoya kopyalandı",

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
  return translate(getLocale(), key, params);
}

/**
 * Translate UI String into a Given Language (the site build has no active language).
 *
 * @param locale - Language
 * @param key - Message Key
 * @param params - Values for `{name}` Placeholders
 * @returns Translated Text
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return MESSAGES[locale][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
