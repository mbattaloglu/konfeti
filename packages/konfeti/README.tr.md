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
import { Konfeti, KonfetiFactory, KonfetiPresets, type FireOptions } from "konfeti";

Konfeti.fire(); // paylaşılan tam ekran canvas
Konfeti.fire(KonfetiPresets.SNOW);
Konfeti.onClick(button, { particleCount: 30 });
Konfeti.reset();

const stage = KonfetiFactory.create(canvas, { maxParticles: 800 }); // kendi canvas'ın
stage.fire();
stage.destroy();

const options: FireOptions = { particleCount: 80 };
```

## İçindekiler

- [Bir bakışta API](#bir-bakışta-api)
- [Temeller](#temeller)
- [Kağıt parçacığı](#kağıt-parçacığı)
- [Şekiller](#şekiller)
- [Fizik](#fizik)
- [Atış düzeni](#atış-düzeni)
- [Hazır ayarlar](#hazır-ayarlar)
- [Hook'lar](#hooklar)
- [Instance'lar ve canvas'lar](#instancelar-ve-canvaslar)
- [Worker ile çizim](#worker-ile-çizim)
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
  },
});
```

Formlar: `rect`, `square`, `circle`, `strip`, `leaf`. Diğer stil ayarları: `scale`, `colorMode`, `backShade`,
`colorOverLife`, `opacity`, `fadeIn`, `rotation`, `rotationSpeed`, `tilt`, `shadow`, `blendMode`.
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
yükleyebilirsin.

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
  },
});
```

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

Sayfadaki ilk instance, konsola sürümü ve çizim yöntemini gösteren tek satırlık bir banner yazar. Konsolu sessiz
tutmak için patlatmadan önce `disableBanner()` çağır.

## Worker ile çizim

`KonfetiFactory.createWorker()`, simülasyonu ve çizimi bir `OffscreenCanvas` üzerinden Web Worker'a taşır.
Böylece ana thread meşgulken (ağır React render'ları, uzun görevler, kaydırma) büyük patlamalar akıcı kalır:

```ts
import { KonfetiFactory } from "konfeti";

const stage = KonfetiFactory.createWorker(document.querySelector("canvas"), { maxParticles: 3000 });

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

Worker betiği (~13.7 kB brotli) yalnızca ilk worker instance'ı oluşturulduğunda yüklenir. Bundler kullanıyorsan
betik bir `blob:` URL olarak gömülür; `<script>` sürümü ise `konfeti.worker.js` dosyasını kendi klasöründen
yükler. `worker-src blob:` izni olmayan sıkı bir Content-Security-Policy'de `konfeti/worker.js` dosyasını
kendin barındır:

```ts
KonfetiFactory.createWorker(canvas, { workerUrl: "/vendor/konfeti.worker.js" });
```

Betik yüklenemezse her patlama asılı kalmak yerine açık bir hatayla reddedilir.

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

| Kullanım                                         | Boyut (min + brotli) |
| ------------------------------------------------ | -------------------- |
| `konfeti` içinden `Konfeti`                      | ~14.3 kB             |
| `konfeti` içinden her şey                        | ~17.2 kB             |
| `konfeti/lite` içinden `Konfeti`                 | ~11.4 kB             |
| worker betiği (yalnızca `createWorker()` yükler) | ~13.7 kB             |

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
