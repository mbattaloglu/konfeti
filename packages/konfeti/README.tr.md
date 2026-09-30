# konfeti

Bağımlılığı olmayan, sıkı tiplenmiş ve neredeyse her ayarı değiştirilebilen canvas konfeti kütüphanesi.
**Emoji, metin, görsel ve spritesheet** parçacıklarını doğrudan destekler; fizik modülleri birleştirilebilir,
eklenti API'si tiplidir.

[English](./README.md) · **Türkçe**

```sh
npm install konfeti
```

```ts run
import { Konfeti } from "konfeti";

Konfeti.fire(); // klasik konfeti patlaması
```

## Bir bakışta API

```ts
import {
  Konfeti, // hazır, paylaşılan instance: tam ekran bir katman canvas'ına çizer
  KonfetiFactory, // kendi canvas'ında ek instance'lar kurar (Web Worker: konfeti/worker içinde createWorker)
  KonfetiPresets, // hazır görünümler: SNOW, FIREWORKS, STARS …
  extendPreset, // bir hazır ayar + senin ayarların
  type FireOptions, // tüm fire() ayarlarının tipi, otomatik tamamlama için
} from "konfeti";

// ── paylaşılan instance: hiçbir kurulum gerekmez ──
Konfeti.fire(); // ekran ortasının biraz altından yukarı doğru tek bir klasik konfeti patlaması
Konfeti.fire({ particleCount: 120, spread: 90, origin: { x: 0.5, y: 0.3 } }); // kendi ayarların
Konfeti.fire(KonfetiPresets.SNOW); // bir hazır ayar, olduğu gibi
Konfeti.fire(extendPreset(KonfetiPresets.SNOW, { particleCount: 60 })); // bir hazır ayar, değiştirilmiş

const burst = Konfeti.fire(); // her fire() o patlamanın handle'ını döndürür…
burst.pause(); // …sadece bu patlamayı dondur
burst.resume(); // …devam ettir
await burst; // …ya da son parçacığı yok olana kadar bekle

const trail = Konfeti.emit({ rate: 40, follow: "pointer" }); // imleci takip eden bir akış…
trail.stop(); // …sen durdurana kadar

Konfeti.onClick(button, { particleCount: 30 }); // her tıklamada tıklanan noktadan patlat
Konfeti.pause(); // her şeyi dondur (ör. reklam görünür değilken)
Konfeti.resume(); // her şeye devam et
Konfeti.reset(); // tüm parçacıkları bir anda kaldır

// ── kendi instance'ın: kendi canvas'ı, kendi varsayılanları, kendi parçacık sınırı ──
const stage = KonfetiFactory.create(canvas, { maxParticles: 800 });
stage.fire(); // Konfeti ile aynı API, `canvas` üzerine çizer
stage.destroy(); // işin bitince durdurur, temizler ve dinleyicilerini kaldırır

// ── tipli seçenekler: her ayar otomatik tamamlanır ve denetlenir ──
const options: FireOptions = { particleCount: 80, paper: { colors: ["#d6ff3f", "#ffffff"] } };
Konfeti.fire(options);
```

## İçindekiler

- [Bir bakışta API](#bir-bakışta-api)
- [Temeller](#temeller)
- [Kağıt parçacığı](#kağıt-parçacığı)
- [Şekiller](#şekiller)
- [Fizik](#fizik)
- [Atış düzeni](#atış-düzeni)
- [Sürekli yayıcı](#sürekli-yayıcı)
- [Hazır ayarlar](#hazır-ayarlar)
- [Hook'lar](#hooklar)
- [Instance'lar ve canvas'lar](#instancelar-ve-canvaslar)
- [Worker ile çizim](#worker-ile-çizim)
- [Playable reklamlar ve webview'lar](#playable-reklamlar-ve-webviewlar)
- [Özel şekiller ve fizik](#özel-şekiller-ve-fizik)
- [Paket boyutu ve `konfeti/lite`](#paket-boyutu-ve-konfetilite)
- [Birimler ve aralıklar](#birimler-ve-aralıklar)

## Temeller

```ts run
import { Konfeti } from "konfeti";

const burst = Konfeti.fire({
  particleCount: 120,
  angle: 60, // 90 = yukarı, 0 = sağa
  spread: 55,
  origin: { x: 0, y: 0.7 }, // canvas üzerinde normalize konum
});

burst.pause();
burst.resume();
await burst; // her parçacık yok olunca tamamlanır
```

`origin` bir **element** (parçacıklar elementin ortasından çıkar) ya da bir **tıklama olayı** da olabilir:

```ts
button.addEventListener("click", (event) => Konfeti.fire({ origin: event }));
Konfeti.fire({ origin: document.querySelector("#buy")! });
```

Her sayısal seçenek sabit bir değer ya da rastgele bir **aralık** alır: `10`, `[8, 14]` veya `{ min: 8, max: 14 }`.

## Kağıt parçacığı

Varsayılan konfeti parçasının her ayarı `paper` ile değiştirilebilir:

```ts run
Konfeti.fire({
  paper: {
    form: ["rect", "circle", { value: "strip", weight: 2 }], // ağırlıklı form karışımı
    width: [6, 10],
    height: [12, 18],
    cornerRadius: 2, // ya da { tl: 6, br: 6 }
    skew: [-15, 15],
    colors: ["#ff0a54", "#ffd000", { color: "#00c2ff", weight: 3 }],
    backColor: "auto", // takla atarken ön rengin koyulaştırılmış hali
    stroke: { color: "white", width: 0.5 },
    gradient: { colors: ["gold", "orange"], angle: 45 },
    flip: { axis: "both", frequency: [0.5, 1.5] },
    wobble: { amplitude: [2, 8] },
    fadeOut: { start: 0.6, easing: "easeInQuad" },
    scaleOverLife: { to: 0.4 },
    shine: 0.5,
    trail: { length: 12 }, // her parçanın arkasında sönen bir iz
  },
});
```

Renk temaları: `KonfetiPalettes.PASTEL`, `GOLD`, `NEON`, `RAINBOW`, `WINTER`, `AUTUMN`, `OCEAN`, `CANDY`, `FOREST`,
`MONOCHROME` ve `CLASSIC` hazır renk listeleridir — `paper: { colors: KonfetiPalettes.GOLD }`.

Formlar: `rect`, `square`, `circle`, `strip`, `leaf`. Diğer stil ayarları: `scale`, `colorMode`, `backShade`,
`colorOverLife`, `opacity`, `fadeIn`, `rotation`, `rotationSpeed`, `tilt`, `shadow`, `blendMode`, `trail` (her şekilde
çalışır, ör. `{ type: "star", trail: true }`).
Her seçenek tip tanımlarında açıklanmıştır; editöründe üzerine gelmen yeterli.

## Şekiller

İstediğin şekilleri ağırlıklarla karıştırabilirsin. `paper` içindeki stil ayarları her şeklin temelidir; her
şekil bunları kendi içinde geçersiz kılabilir.

```ts run
Konfeti.fire({
  paper: { colors: ["#ff0a54", "#ffd000"] },
  shapes: [
    { type: "paper", weight: 4 },
    { type: "star", points: [5, 6], shine: 0.6 },
    { type: "heart", colors: "#ff4d6d" },
    { type: "emoji", emoji: ["🎉", "🥳", { value: "✨", weight: 3 }], size: [22, 32] },
    { type: "text", text: ["YAY", "WOW"], fontWeight: 900 },
    { type: "image", src: "/coin.png", size: [20, 30] },
    { type: "spritesheet", src: "/coin-spin.png", frames: { cols: 8, rows: 1 }, fps: 14 },
  ],
});
```

| Tür           | Türe özel seçenekler                                              |
| ------------- | ----------------------------------------------------------------- |
| `paper`       | kağıt geometrisi (yukarıya bak)                                   |
| `star`        | `size`, `points`, `innerRatio`                                    |
| `triangle`    | `size`                                                            |
| `polygon`     | `size`, `sides`                                                   |
| `heart`       | `size`                                                            |
| `ribbon`      | `length`, `thickness`, `waves`                                    |
| `path`        | `path` (SVG `d` ya da `Path2D`), `viewBox`, `size`                |
| `emoji`       | `emoji`, `size` (yazı boyutu), `fontFamily`                       |
| `text`        | `text`, `size` (yazı boyutu), `fontFamily`, `fontWeight`          |
| `image`       | `src` (URL ya da herhangi bir canvas görsel kaynağı), `size` (en) |
| `spritesheet` | `src`, `frames`, `fps`, `loop`, `randomStartFrame`, `size`        |

Emoji ve metin bir kez rasterize edilip önbelleğe alınır. URL görsellerini `loadImage(url)` ile önceden
yükleyebilirsin. `image` ya da `spritesheet` için `<svg` ile başlayan bir `src` satır içi SVG olarak kullanılır
(`width` ve `height` ver; worker modunda desteklenmez).

## Fizik

```ts run
Konfeti.fire({
  physics: {
    gravity: 700, // px/s², negatif değer yukarı doğru süzülür
    drag: 3.5, // 1/s
    wind: [-40, 40], // px/s²
    terminalVelocity: 900, // px/s
    swirl: { strength: [80, 200], frequency: [0.3, 0.8] },
    floor: { y: 1, bounce: 0.35, friction: 0.4 }, // parçacıklar seker ve durur
    attract: { target: "pointer", strength: 900 }, // imlece çekilir; negatif değer iter
  },
});
```

`attract` hedefi bir element (her karede ölçülür), `"pointer"` ya da `{ x: 0.5, y: 0.2 }` gibi bir nokta olabilir;
`radius` erişimini sınırlar, `falloff: "linear"` ise kenara doğru zayıflatır.

## Atış düzeni

```ts run
Konfeti.fire({ emission: { mode: "burst" } }); // varsayılan: hepsi bir anda
Konfeti.fire({ particleCount: 200, emission: { mode: "stream", duration: 3000 } }); // fıskiye
Konfeti.fire({
  particleCount: 50,
  emission: { mode: "interval", every: 350, times: 8 },
  origin: { x: [0.2, 0.8] },
});
```

Aralıklı atışlarda çıkış noktası her atışta bir kez seçilir; aralık olarak verilen bir `origin` farklı
noktalarda havai fişek etkisi yaratır.

## Sürekli yayıcı

`emit()` sen durdurana kadar parçacık akıtır — bir fıskiye, imlecin arkasında bir iz, bir elementten çıkan
kıvılcımlar. `particleCount` / `origin` / `emission` dışında tüm `fire()` ayarlarını alır; bunlara ek olarak
`rate` (saniyedeki parçacık) ve `follow`:

```ts run
const trail = Konfeti.emit({
  rate: 60, // saniyedeki parçacık sayısı
  follow: "pointer", // ya da bir element (her yayında ölçülür) ya da { x: 0.5, y: 1 } gibi bir nokta
  spread: 360,
  startVelocity: [50, 150],
  lifetime: 800,
  shapes: [{ type: "star", size: [6, 10] }],
});

setTimeout(() => trail.stop(), 3000); // yaymayı durdur; çıkmış parçacıklar ömürlerini tamamlar
await trail; // sonuncusu da yok olunca tamamlanır
```

`trail.moveTo(hedef)` neyi takip ettiğini değiştirir, `clear()` her şeyi bir anda kaldırır, `pause()` /
`resume()` dondurur. Worker instance'ları (`konfeti/worker`) da yayabilir; imleç ya da element ana thread'de
takip edilir.

## Hazır ayarlar

```ts run
import { Konfeti, KonfetiPresets, extendPreset } from "konfeti";

Konfeti.fire(KonfetiPresets.FIREWORKS);
Konfeti.fire(extendPreset(KonfetiPresets.SNOW, { emission: { mode: "stream", duration: 10000 } })); // senin ayarların geçerli olur
```

`BASIC`, `REALISTIC`, `CANNON`, `SIDE_SHOTS`, `SCHOOL_PRIDE`, `FIREWORKS`, `SNOW`, `STARS`, `EMOJI_RAIN`,
`HEART_BURST`. Hazır ayarlar sıradan, salt okunur seçeneklerdir (`SIDE_SHOTS` ve `SCHOOL_PRIDE` iki patlamadır).
`extendPreset` senin ayarlarını hazır ayarı değiştirmeden her patlamaya ekler; `paper` ve `physics` anahtar anahtar
birleşir.

## Hook'lar

```ts run
Konfeti.fire({
  onStart: () => {},
  onParticleSpawn: (p) => {},
  onParticleUpdate: (p, dt) => {}, // sık çalışan yol, p.x / p.vx … değiştirilebilir
  onParticleDeath: (p) => {},
  onComplete: () => {},
});
```

## Instance'lar ve canvas'lar

`Konfeti`, paylaşılan tam ekran bir instance'tır. Kendi canvas'ın, ayrı varsayılanlar ya da ayrı bir parçacık
bütçesi için `KonfetiFactory.create()` kullan:

```ts
import { KonfetiFactory } from "konfeti";

const stage = KonfetiFactory.create(document.querySelector("canvas"), {
  maxParticles: 800,
  disableForReducedMotion: true,
  defaults: { paper: { colors: ["gold", "white"] } },
});

stage.fire({ particleCount: 80 });
const off = stage.onClick(document.querySelector("#like")!, { particleCount: 30 });
off(); // dinlemeyi bırak
stage.reset();
stage.destroy(); // tıklama dinleyicilerini de kaldırır
```

`onClick` üçüncü bir argüman alır: `trigger: "pointerdown"` parmak ya da tuş basıldığı anda patlatır (sayfa
dokunma olaylarını iptal etse bile çalışır), `onFire` ise her tıklama patlamasının handle'ını verir:

```ts
Konfeti.onClick(
  button,
  { particleCount: 30 },
  {
    trigger: "pointerdown",
    onFire: (burst) => burst.then(() => console.log("bitti")),
  },
);
```

`pause()` her patlamayı o anki karesinde dondurur, `resume()` duraklatılan süreyi saymadan devam ettirir (gizli
sekmeler zaten kendiliğinden durur). İkisi de hem `Konfeti`'de hem her instance'ta var.

Sayfadaki ilk instance, konsola sürümü ve çizim yöntemini gösteren tek satırlık bir banner yazar. Konsolu sessiz
tutmak için patlatmadan önce `disableBanner()` çağır (`konfeti/lite` bu banner'ı hiç yazmaz).

## Worker ile çizim

`konfeti/worker` içindeki `createWorker()`, simülasyonu ve çizimi bir `OffscreenCanvas` üzerinden Web Worker'a taşır.
Böylece ana thread meşgulken (ağır React render'ları, uzun görevler, kaydırma) büyük patlamalar akıcı kalır:

```ts
import { createWorker } from "konfeti/worker"; // ayrı bir giriş: diğer bundle'lar worker kodu taşımaz

const stage = createWorker(document.querySelector("canvas"), { maxParticles: 3000 });

await stage.fire({
  particleCount: 1500,
  shapes: [{ type: "paper" }, { type: "emoji", emoji: "🎉" }],
});
stage.isWorker(); // tarayıcı offscreen çizemiyorsa false — o zaman ana thread'de çalışır
stage.destroy(); // worker'ı sonlandırır
```

Canvas yerine `null` verirsen (ya da hiçbir şey vermezsen) `Konfeti` gibi tam ekran bir katman elde edersin.

Seçenekler worker'a `postMessage` ile gider, bu yüzden structured-clone ile kopyalanabilir olmaları gerekir.
Tipler (`WorkerFireOptions`) bunu zorunlu kılar:

| Worker'da çalışır                                   | Yalnızca ana thread'de                                  |
| --------------------------------------------------- | ------------------------------------------------------- |
| tüm kağıt, stil, fizik ve atış düzeni seçenekleri   | hook'lar (`onStart`, `onParticleSpawn`, `onComplete` …) |
| yerleşik şekiller, emoji ve metin                   | özel `defineShape` / `definePhysics` modülleri          |
| URL ya da `ImageBitmap` ile `image` / `spritesheet` | `HTMLImageElement`, `Path2D` ve diğer DOM kaynakları    |
| nokta, element ya da tıklama olayı olarak `origin`  | —                                                       |

Element ve tıklama çıkış noktaları gönderilmeden önce ana thread'de ölçülür. `onComplete` yerine dönen handle'ı
`await` et.

Worker betiği (~15.1 kB brotli) yalnızca ilk worker instance'ı oluşturulduğunda yüklenir. Bundler kullanıyorsan
betik bir `blob:` URL olarak gömülür; `<script>` sürümü ise `konfeti.worker.js` dosyasını kendi klasöründen
yükler. `worker-src blob:` izni olmayan sıkı bir Content-Security-Policy'de `konfeti/konfeti.worker.js` dosyasını
kendin barındır:

```ts
createWorker(canvas, { workerUrl: "/vendor/konfeti.worker.js" });
```

Betik yüklenemezse her patlama asılı kalmak yerine açık bir hatayla reddedilir.

Hook'lar worker içinde çalışamaz, bu yüzden worker instance'ı sayımı kendisi yapar: `stage.getStats()`
`{ live, spawned, died, completed }` döndürür (saniyede birkaç kez güncellenir).

## Playable reklamlar ve webview'lar

konfeti tek dosyalık playable reklamlarda çalışır: bağımlılığı yoktur, kendi başına ağ isteği yapmaz, depolama ve
`eval` kullanmaz. `Konfeti.fire()` yaklaşık 54 kB minified (16 kB brotli) ekler; reklam ağları genelde
sıkıştırılmamış boyutu sayar. Dikkat edilecekler:

- **Görseller:** `data:` URI ya da motorunun zaten yüklediği bir görsel / canvas ver — `/coin.png` gibi bir URL
  ağ isteğidir.
- **Web fontları:** metin ve emoji bir kez çizilip önbelleğe alınır; `@font-face` yüklenmeden çizilen bir glif,
  font gelince kendiliğinden yeniden çizilir.
- **Emoji'ler** her platformda farklı görünür (eski Android'lerde yenileri hiç olmayabilir); görünüm birebir
  olmalıysa `image` şekli kullan.
- **Dokunma:** motorun dokunma olaylarını iptal ediyorsa telefonda `click` hiç gelmez —
  `onClick(target, options, { trigger: "pointerdown" })` kullan ya da kendi input handler'ından
  `origin: { x, y }` (0–1) veya pointer olayıyla patlat.
- **Görünürlük:** MRAID `viewableChange` olayında `Konfeti.pause()` / `Konfeti.resume()` çağır.
- **Worker ile çizim:** reklamlarda kullanma — bazı webview'lar `blob:` worker'ları engeller ve dinamik importları
  gömen tek dosyalık bir build, `konfeti/worker` import ettiğin anda 44 kB'lık worker betiğini de taşır.
- **Konsol:** production build'lerinde `disableBanner()` çağır.
- **Hedef:** build ES2022'dir (Chrome 85+ / iOS 14.5+); daha eski webview'lar için bundler'ın dönüştürsün.

## Özel şekiller ve fizik

Kendi şekillerini ve fizik modüllerini kaydet. Seçeneklerini bir kez tanımlarsın, her yerde tam tipli olurlar.

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

// path tabanlı: gradyan, kontur, parlama ve takla kendiliğinden çalışır
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

Çizim tabanlı şekiller (`defineShape(name, { draw(ctx, particle, options) { … } })`) canvas üzerinde tam
kontrol verir; dönüşüm (transform) önceden uygulanmış olur.

## Paket boyutu ve `konfeti/lite`

| Kullanım                                                 | Boyut (min + brotli) |
| -------------------------------------------------------- | -------------------- |
| `konfeti` içinden `Konfeti`                              | ~15.8 kB             |
| `konfeti` içinden her şey                                | ~17.3 kB             |
| `konfeti/lite` içinden `Konfeti`                         | ~12.6 kB             |
| `konfeti/worker` içinden `createWorker`                  | ~17.7 kB             |
| worker betiği (ilk `createWorker()` çağrısında yüklenir) | ~14.2 kB             |

`konfeti` tüm yerleşik şekilleri senin için kaydeder. `konfeti/lite` ise **yalnızca kağıt** ile başlar; sadece
kullandığın şekilleri kaydedersen bundler geri kalanını atar:

```ts run
import { Konfeti, registerShapes, starShape, emojiShape } from "konfeti/lite";

registerShapes(starShape, emojiShape);
Konfeti.fire({ shapes: [{ type: "star" }, { type: "emoji", emoji: "🎉" }] });
```

Hazır ayarlar yalnızca tam sürümde bulunur (birden çok şekil kullanırlar).

## Birimler ve aralıklar

| Takma ad                   | Anlamı                                 |
| -------------------------- | -------------------------------------- |
| `Pixels`                   | CSS pikseli (DPR ölçeklemesinden önce) |
| `Degrees`                  | 0 = sağ, 90 = yukarı                   |
| `Milliseconds`             | zaman                                  |
| `Ratio`                    | 0–1 (sınırlandırılır)                  |
| `Hertz`                    | saniyedeki döngü                       |
| `PixelsPerSecond(Squared)` | hız / ivme                             |

Geçersiz seçenekler, seçeneğin adını veren bir `TypeError` fırlatır (`"paper.width" must be a finite number`).

## Lisans

[MIT](../../LICENSE)
