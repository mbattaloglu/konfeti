# konfeti

**Başlarken minicik, ihtiyacın olduğu kadar ileri giden canvas konfeti.** Klasik bir patlama için tek bir
çağrı — daha fazlasını istediğinde emoji, metin, görsel ve spritesheet'ler, imleci takip eden akışlar,
birleştirilebilir fizik, Web Worker ile çizim ve tamamen tipli bir eklenti API'si. Sıfır bağımlılık.

[![npm](https://img.shields.io/npm/v/konfeti?color=d6ff3f)](https://www.npmjs.com/package/konfeti)
[![CI](https://github.com/mbattaloglu/konfeti/actions/workflows/ci.yml/badge.svg)](https://github.com/mbattaloglu/konfeti/actions/workflows/ci.yml)
![size](<https://img.shields.io/badge/Konfeti.fire()-~16%20kB%20brotli-d6ff3f>)
![dependencies](https://img.shields.io/badge/dependencies-0-d6ff3f)
![types](https://img.shields.io/badge/types-included-3178c6)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[English](README.md) · **Türkçe**

**[Deneme Alanı](https://konfeti.mbattaloglu.com/?lang=tr)** ·
**[Rehber](https://konfeti.mbattaloglu.com/docs/?lang=tr)** ·
**[API referansı](https://konfeti.mbattaloglu.com/docs/api/)** (İngilizce)

[![konfeti deneme alanı: canlı seçenek editörünün yanında havada kağıt, yıldız ve emoji](docs/assets/playground.png)](https://konfeti.mbattaloglu.com/?lang=tr)

```ts
import { Konfeti } from "konfeti";

Konfeti.fire(); // bu kadar: tam ekran bir katmanda klasik bir konfeti patlaması
```

## İçindekiler

- [Neden konfeti](#neden-konfeti)
- [Kurulum](#kurulum)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Özellikler](#özellikler)
- [Giriş noktaları](#giriş-noktaları)
- [Paket boyutu](#paket-boyutu)
- [Tarayıcı desteği](#tarayıcı-desteği)
- [Playable reklamlar ve webview'lar](#playable-reklamlar-ve-webviewlar)
- [Dokümantasyon](#dokümantasyon)
- [Geliştirme](#geliştirme)
- [Lisans](#lisans)

## Neden konfeti

- **Tek çağrı, kurulum yok.** `Konfeti.fire()` katman canvas'ını ilk kullanımda oluşturur, cihazın piksel
  oranıyla pencere boyutunda tutar ve son parçacık yok olduğunda animasyon döngüsünü durdurur.
- **Kağıt parçacığının her ayarı senin** — formlar, renkler, gradyanlar, köşe yarıçapı, takla, salınım,
  parlama, ömür boyunca kaybolma ve ölçek — ve her sayısal seçenek sabit bir değer ya da rastgele bir aralık
  alır.
- **Kağıttan fazlası.** Yıldızlar, kalpler, çokgenler, kurdeleler, SVG path'leri, emoji, metin, görseller ve
  animasyonlu spritesheet'ler; hepsi tek bir patlamada ağırlıklarla karıştırılabilir.
- **Tipler ürünün bir parçası.** Her seçenek kendi tipinde açıklanmıştır, otomatik tamamlanır ve denetlenir:
  yanlış yazılmış bir şekil ya da yersiz bir seçenek derlenmez. Kendi şekillerin ve fizik modüllerin de
  declaration merging ile aynı tiplere katılır.
- **Kare döngüsü için tasarlandı.** Havuzlanan parçacıklar, karede sıfır bellek ayırma, bir kez rasterize edilip
  önbelleğe alınan glifler, kaynak dikdörtgeniyle çizilen spritesheet'ler; ekranda bir şey kalmayınca döngü
  kendini durdurur.
- **Küçük, ve yalnızca kullandığın kadar büyük.** Tam `Konfeti.fire()` için ~19 kB brotli, `konfeti/lite` ile
  ~14 kB; Web Worker ile çizim ayrı bir girişte yaşar — onu hiç kullanmayan bundle'lar ondan hiçbir şey
  taşımaz.

## Kurulum

**npm**

```sh
npm install konfeti
```

**pnpm**

```sh
pnpm add konfeti
```

**yarn**

```sh
yarn add konfeti
```

Bundler olmadan `<script>` sürümünü yükle (`window.konfeti`'yi tanımlar):

```html
<script src="https://cdn.jsdelivr.net/npm/konfeti/dist/konfeti.iife.js"></script>
<script>
  konfeti.Konfeti.fire();
</script>
```

## Hızlı başlangıç

```ts
import { Konfeti, KonfetiPresets } from "konfeti";

// bir butondan, yukarı doğru ve varsayılandan biraz daha geniş patlat
button.addEventListener("click", (event) => {
  Konfeti.fire({ origin: event, spread: 90, particleCount: 120 });
});

// hazır bir görünüm
Konfeti.fire(KonfetiPresets.FIREWORKS);

// her patlama await edilebilir
await Konfeti.fire({ particleCount: 80 });
console.log("son parçacık da yok oldu");
```

## Özellikler

### Kağıt parçacığı

Varsayılan konfeti parçası, tamamen ayarlanabilir. Sayılar bir değer, `[min, max]` aralığı ya da
`{ min, max }` alır.

```ts
Konfeti.fire({
  paper: {
    form: ["rect", "circle", { value: "strip", weight: 2 }], // ağırlıklı form karışımı
    width: [6, 10],
    height: [12, 18],
    cornerRadius: 2, // ya da köşe köşe: { tl: 6, br: 6 }
    colors: ["#ff0a54", "#ffd000", { color: "#00c2ff", weight: 3 }],
    gradient: { colors: ["gold", "orange"], angle: 45 },
    flip: { axis: "both", frequency: [0.5, 1.5] }, // arka yüz daha koyu bir ton gösterir
    wobble: { amplitude: [2, 8] },
    shine: 0.5, // dönerken parlak bir yansıma
    trail: { length: 12 }, // her parçanın arkasında sönen bir iz
    fadeOut: { start: 0.6, easing: "easeInQuad" },
  },
});
```

Renk temaları hazır: `paper: { colors: KonfetiPalettes.PASTEL }` — ayrıca `GOLD`, `NEON`, `RAINBOW`, `WINTER`,
`AUTUMN`, `OCEAN`, `CANDY`, `FOREST`, `MONOCHROME` ve `CLASSIC`.

### Şekiller: emoji, metin, görsel, spritesheet …

İstediğin şekilleri ağırlıklarla karıştır; her biri kağıt stilini kendi içinde geçersiz kılabilir.

```ts
Konfeti.fire({
  shapes: [
    { type: "paper", weight: 4 },
    { type: "star", points: [5, 6], shine: 0.6 },
    { type: "heart", colors: "#ff4d6d" },
    { type: "emoji", emoji: ["🎉", "🥳", "✨"], size: [22, 32] },
    { type: "text", text: ["YAY", "WOW"], fontWeight: 900 },
    { type: "image", src: "/coin.png", size: [20, 30] },
    { type: "spritesheet", src: "/coin-spin.png", frames: { cols: 8, rows: 1 }, fps: 14 },
  ],
});
```

Yerleşik: `paper`, `star`, `triangle`, `polygon`, `heart`, `ribbon`, `path` (herhangi bir SVG path'i), `emoji`,
`text`, `image` ve `spritesheet` (URL, görsel elementi ya da satır içi `<svg>` metni). Emoji ve metin bir kez
rasterize edilip önbelleğe alınır — web fontu sonradan
yüklenirse kendiliğinden yeniden çizilir.

### Hazır ayarlar

Sıradan, salt okunur veri olarak on hazır görünüm:

```ts
import { Konfeti, KonfetiPresets, extendPreset } from "konfeti";

Konfeti.fire(KonfetiPresets.SNOW);
Konfeti.fire(extendPreset(KonfetiPresets.FIREWORKS, { particleCount: 80 })); // senin ayarların geçerli olur
```

`BASIC`, `REALISTIC`, `CANNON`, `SIDE_SHOTS`, `SCHOOL_PRIDE`, `FIREWORKS`, `SNOW`, `STARS`, `EMOJI_RAIN`,
`HEART_BURST`; bunlara ek olarak yeni seçenekleri gösterenler: `SHOOTING_STARS` (iz), `MAGNET` (çekim),
`FORCE_FIELD` (itme), `GOLDEN` (altın paleti), `SPARKLER` ve `FIREFLIES` (toplamalı ışıma), `JACKPOT` (zemin),
`CONGRATS`, `SUCCESS` ve `LEVEL_UP` (metin formasyonu; `LEVEL_UP` `delay` ile sıralanır) ve `LOGO_REVEAL`
(görsel formasyonu).

### Sürekli yayıcı

Sen durdurana kadar parçacık akıt — bir fıskiye, imlecin arkasında bir iz, bir elementten çıkan kıvılcımlar.

```ts
const trail = Konfeti.emit({
  rate: 60, // saniyedeki parçacık sayısı
  follow: "pointer", // ya da bir element, ya da { x: 0.5, y: 1 } gibi bir nokta
  spread: 360,
  startVelocity: [50, 150],
  shapes: [{ type: "star", size: [6, 10] }],
});

trail.moveTo(document.querySelector("#rocket")!); // başka bir şeyi takip et
trail.stop(); // yaymayı durdur; çıkmış parçacıklar ömürlerini tamamlar
await trail;
```

### Şekil oluşturma

Parçacıklar bir metin ya da görsel oluşturur, bir süre öyle durur, sonra dağılır. Her şekil türü katılabilir.

```ts
Konfeti.fire({
  formation: { text: "KAZANDIN", font: "900 110px sans-serif", hold: 1200 }, // ya da image: "/logo.png"
  shapes: [{ type: "paper", weight: 3 }, { type: "star" }],
});
```

### Fizik ve atış düzeni

```ts
Konfeti.fire({
  physics: {
    gravity: 700, // px/s² — negatif değer yukarı doğru süzülür
    drag: 3.5,
    wind: [-40, 40],
    swirl: { strength: [80, 200], frequency: [0.3, 0.8] },
    floor: { y: 1, bounce: 0.35, friction: 0.4 }, // parçacıklar seker ve durur
    attract: { target: "pointer", strength: 900 }, // imlece çekilir; negatif değer iter
  },
  emission: { mode: "interval", every: 350, times: 8 }, // ya da "burst" (varsayılan) / "stream"
  seed: 42, // aynı seed, aynı patlama
});
```

### Kontrol

```ts
const burst = Konfeti.fire(); // her fire() bir handle döndürür
burst.pause();
burst.resume();
burst.stop();
await burst;
// aynı patlama yeniden (KonfetiFactory.create(canvas, { fixedTimestep: true }) ile birebir)
Konfeti.fire({ seed: burst.getSeed() });

Konfeti.pause(); // her şeyi dondur (gizli sekmeler zaten kendiliğinden durur)
Konfeti.resume();
Konfeti.reset(); // tüm parçacıkları kaldır

// her tıklamada tıklanan noktadan patlat; "pointerdown", dokunma olayları iptal edilse bile çalışır
const off = Konfeti.onClick(button, { particleCount: 30 }, { trigger: "pointerdown" });
off();
```

Hook'lar — `onStart`, `onParticleSpawn`, `onParticleUpdate`, `onParticleDeath`, `onComplete` — her parçacığı
izlemeni ya da yönlendirmeni sağlar.

### Kendi canvas'ın

`Konfeti` paylaşılan, tam ekran bir instance'tır. Kendi canvas'ın, varsayılanların ya da parçacık bütçen için
ayrı instance'lar oluştur:

```ts
import { KonfetiFactory } from "konfeti";

const stage = KonfetiFactory.create(document.querySelector("canvas"), {
  maxParticles: 800, // bunu aşınca en eski parçacıklar yer açar (varsayılan 1500)
  disableForReducedMotion: true, // prefers-reduced-motion'a uy (varsayılan kapalı)
  defaults: { paper: { colors: ["gold", "white"] } },
});

stage.fire();
stage.destroy(); // durdurur, temizler ve dinleyicilerini kaldırır
```

### Web Worker ile çizim

Simülasyonu ve çizimi ana thread'den çıkar; sayfa meşgulken bile büyük patlamalar akıcı kalsın:

```ts
import { createWorker } from "konfeti/worker";

const stage = createWorker(document.querySelector("canvas"), { maxParticles: 3000 });
await stage.fire({ particleCount: 1500 });
stage.isWorker(); // OffscreenCanvas yoksa false — o zaman ana thread'de çalışır
```

Seçeneklerin worker'a gönderilebilir olduğu tiplerle denetlenir, element ve tıklama çıkış noktaları senin için
ölçülür, `stage.getStats()` de (worker içinde çalışamayan) hook'ların yerini alır. Worker betiği ilk kullanımda
yüklenir.

### Özel şekiller ve fizik

```ts
import { Konfeti, defineShape, definePhysics } from "konfeti";

declare module "konfeti" {
  interface ShapeRegistry {
    diamond: { sharpness?: number };
  }
  interface PhysicsRegistry {
    magnet: { x: number; y: number; strength: number };
  }
}

defineShape("diamond", {
  viewBox: [24, 24],
  path: ({ sharpness = 0.5 }) => `M12 0L${24 - sharpness * 12} 12L12 24L${sharpness * 12} 12Z`,
});

definePhysics("magnet", {
  defaults: { x: 0.5, y: 0.5, strength: 600 },
  apply: (p, dt, world, { x, y, strength }) => {
    p.vx += (x * world.width - p.x) * strength * dt * 0.001;
    p.vy += (y * world.height - p.y) * strength * dt * 0.001;
  },
});

Konfeti.fire({
  shapes: [{ type: "diamond", sharpness: 0.8 }],
  physics: { magnet: { strength: 900 } },
});
```

Bir kez tanımlandıktan sonra ikisi de her yerde tam tiplidir — `type: "diamond"` için otomatik tamamlama da
dahil.

## Giriş noktaları

| Import                              | Ne verir                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `konfeti`                           | Her şey: tüm şekiller kayıtlı, hazır ayarlar, konsol banner'ı                  |
| `konfeti/lite`                      | Yalnızca kağıt — sadece kullandığın şekilleri `registerShapes(...)` ile kaydet |
| `konfeti/worker`                    | `createWorker()` ve worker tipleri                                             |
| `konfeti/konfeti.worker.js`         | Sıkı bir Content-Security-Policy altında kendin barındırman için worker betiği |
| `dist/konfeti.iife.js` (`<script>`) | `createWorker` dahil her şeyiyle `window.konfeti`                              |

Her giriş için `.d.ts` ile ESM ve CommonJS build'leri; `sideEffects` ayarlı olduğu için kullanılmayan kod
tree-shaking ile atılır.

## Paket boyutu

[size-limit](https://github.com/ai/size-limit) ile ölçülür (minified + brotli) ve CI'da denetlenir:

| Kullanım                                | Boyut    |
| --------------------------------------- | -------- |
| `konfeti` içinden `Konfeti`             | ~19.3 kB |
| `konfeti` içinden her şey               | ~23.1 kB |
| `konfeti/lite` içinden `Konfeti`        | ~13.9 kB |
| `konfeti/worker` içinden `createWorker` | ~21.4 kB |
| worker betiği (ilk kullanımda yüklenir) | ~18.6 kB |

## Tarayıcı desteği

Güncel (evergreen) tarayıcılar. Build ES2022 hedefler (yaklaşık Chrome 85+, Firefox 79+, Safari / iOS 14.5+);
daha eski webview'ları destekliyorsan bundler'ın dönüştürsün. Worker ile çizim özellik tespitiyle çalışır;
`OffscreenCanvas` olmayan yerde ana thread'e geri döner. Sunucu tarafı render ile de çalışır: import etmek
DOM'a hiç dokunmaz.

## Playable reklamlar ve webview'lar

konfeti tek dosyalık playable reklamlara uyar: bağımlılık yok, kendi başına ağ isteği yok, depolama yok,
`eval` yok. Görselleri `data:` URI ya da motorunun zaten yüklediği elementler olarak ver, motorun dokunma
olaylarını iptal ediyorsa `pointerdown` ile patlat, MRAID `viewableChange` olayında `Konfeti.pause()` ile duraklat
ve production'da `disableBanner()` çağır. Düşük donanımlı telefonlarda
`KonfetiFactory.create(null, { adaptiveQuality: true })`, kareler yavaşladıkça önce çözünürlüğü, sonra efektleri,
en son parçacık sayısını düşürür. Tam kontrol listesi
[rehberde](https://konfeti.mbattaloglu.com/docs/?lang=tr#playable-reklamlar-ve-webviewlar).

## Dokümantasyon

- **[Rehber](https://konfeti.mbattaloglu.com/docs/?lang=tr)** — çalıştırılabilir örneklerle her özellik
  ([kaynak](packages/konfeti/README.tr.md), [English](packages/konfeti/README.md))
- **[API referansı](https://konfeti.mbattaloglu.com/docs/api/)** (İngilizce) — her seçenek, birimi, aralığı ve
  varsayılanı
- **[Deneme Alanı](https://konfeti.mbattaloglu.com/?lang=tr)** — her seçeneği canlı ayarla (Temel ya da Gelişmiş),
  herhangi bir hazır ayarı düzenleyiciye yükle, sonra bir bağlantı paylaş ya da `Konfeti.fire()` kodunu kopyala
- **[Değişiklik günlüğü](packages/konfeti/CHANGELOG.md)** (İngilizce)

## Geliştirme

pnpm monorepo:

| Yol                | Ne                                                                        |
| ------------------ | ------------------------------------------------------------------------- |
| `packages/konfeti` | Kütüphane (npm'e `konfeti` olarak yayımlanır)                             |
| `playground/`      | Site: deneme alanı (`/`), rehber (`/docs/`), API referansı (`/docs/api/`) |
| `e2e/`             | Derlenmiş kütüphane ve siteye karşı Playwright tarayıcı testleri          |
| `docs/PLAN.md`     | Yol haritası ve tasarım notları                                           |

```sh
pnpm install
pnpm dev          # site: http://localhost:5199 (önce API referansını üretir)
pnpm test         # birim + tip testleri (Vitest)
pnpm e2e          # derle, sonra kurulu Chrome'da tarayıcı testleri (Playwright)
pnpm typecheck    # her pakette tsc --noEmit
pnpm lint         # ESLint (strict type-checked)
pnpm build        # kütüphane → ESM + CJS + IIFE + .d.ts
pnpm size         # boyut bütçeleri
pnpm site:build   # statik site → playground/dist
```

Issue'lar ve pull request'ler memnuniyetle karşılanır. CI her push'ta biçim, lint, tipler, birim testleri, build,
boyut bütçeleri ve tarayıcı testlerini çalıştırır.

## Lisans

[MIT](LICENSE) © mbattaloglu
