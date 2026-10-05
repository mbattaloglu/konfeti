/**
 * Turkish Text for One Control.
 */
export type ControlText = {
  /**
   * Label.
   */
  readonly label?: string;
  /**
   * Tooltip Text.
   */
  readonly hint?: string;
  /**
   * Empty-List Text (palette controls).
   */
  readonly empty?: string;
  /**
   * Readout Text for 0 (range controls with a zero label).
   */
  readonly zero?: string;
};

/**
 * Turkish Text for One Section.
 */
export type SectionText = {
  /**
   * Section Title.
   */
  readonly title: string;
  /**
   * Section Description.
   */
  readonly description?: string;
};

/**
 * Shared Shape-Card Control Text (keyed by the part after `<shape>.`).
 */
export const SHAPE_CONTROLS_TR: Readonly<Record<string, ControlText>> = {
  weight: { label: "Ağırlık", hint: "Şekil karışımı içindeki göreli seçilme şansı." },
  size: { label: "Boyut" },
};

/**
 * Turkish Control Text by State Key.
 */
export const CONTROLS_TR: Readonly<Record<string, ControlText>> = {
  // burst
  particleCount: {
    label: "Parçacık Sayısı",
    hint: "Patlama başına parçacık (aralıklı modda atış başına). Şekil oluşturulurken sayıyı Aralık belirler; Parçacık Sayısını Sınırla açıksa bu bir üst sınırdır.",
  },
  angle: {
    label: "Açı",
    hint: "Fırlatma yönü: 90 = dümdüz yukarı, 0 = sağ. İki değer = aradaki rastgele bir yön.",
  },
  spread: { label: "Yayılma", hint: "Açının etrafındaki koninin genişliği." },
  velocity: { label: "Başlangıç Hızı" },
  lifetime: {
    label: "Ömür",
    hint: "Her parçacığın ömrü; iki değer = aradaki rastgele bir süre.",
  },
  originX: {
    label: "Çıkış Noktası X",
    hint: "0 = sol kenar, 1 = sağ kenar. İki değer verilirse parçacıklar bir çizgi boyunca çıkar.",
  },
  originY: {
    label: "Çıkış Noktası Y",
    hint: "0 = üst kenar, 1 = alt kenar; 0'ın altı ya da 1'in üstü ekranın dışından başlar.",
  },
  useSeed: { label: "Seed Kullan", hint: "Aynı seed = her seferinde aynı patlama." },
  seed: { label: "Seed" },

  // emission
  emissionMode: {
    label: "Mod",
    hint: "burst = hepsi bir anda, stream = bir süreye yayılır, interval = tekrarlanan atışlar.",
  },
  streamDuration: { label: "Süre" },
  intervalEvery: { label: "Aralık" },
  intervalTimes: { label: "Tekrar" },
  delay: {
    label: "Gecikme",
    hint: "Patlama fire() çağrısından bu kadar sonra başlar; bir listeyi sıraya koymak için.",
  },

  // formation
  formation: {
    label: "Şekil Oluştur",
    hint: "Açıkken parçacık sayısını Aralık belirler, Dağılma Hızı Başlangıç Hızı'nın yerine geçer ve atış tek seferde olur.",
  },
  formationSource: { label: "Kaynak" },
  formationText: { label: "Metin", hint: "Yeni satır için \\n yaz." },
  formationFont: { label: "Font", hint: "CSS font kısaltması: kalınlık, boyut, aile." },
  formationImage: { label: "Görsel" },
  formationImageUrl: {
    label: "Görsel URL'si",
    hint: "Bir http(s) URL'si, data: URL'si ya da <svg> metni; yüklenen dosyanın aksine paylaşım bağlantısında taşınır. Başka sitelerdeki görseller yalnızca sunucuları CORS'a izin veriyorsa yüklenir.",
  },
  formationUpload: { label: "Görsel Yükle", hint: "Görselin opak pikselleri şekli oluşturur." },
  useFormationWidth: { label: "Sabit Genişlik", hint: "Kapalı: görsel kendi genişliğini korur." },
  formationWidth: { label: "Görsel Genişliği" },
  formationImageColors: {
    label: "Görselin Renkleri",
    hint: "Her parçacığı üzerinde durduğu pikselin rengine boyar.",
  },
  formationMode: {
    label: "Mod",
    hint: "Toplanarak = kenarların ötesinden uçup gelir, Bir Anda = yerinde belirir.",
  },
  formationAssemble: { label: "Toplanma Süresi" },
  formationEasing: {
    label: "Toplanma Easing'i",
    hint: "Toplanmanın hız eğrisi. Bir Anda modunda toplanma olmadığından orada etkisi yoktur.",
  },
  formationHold: { label: "Bekleme", hint: "Şeklin dağılmadan önce ekranda kalma süresi." },
  formationSpacing: {
    label: "Aralık",
    hint: "Parçacıklar arası mesafe: küçüldükçe şekil sıklaşır ve daha çok parçacık kullanılır.",
  },
  formationFit: {
    label: "Sığdırma",
    hint: "Tuvalin en fazla ne kadarını kaplayacağı; daha büyük bir şekil bütün olarak küçültülür.",
  },
  formationVelocity: { label: "Dağılma Hızı" },
  useFormationCap: {
    label: "Parçacık Sayısını Sınırla",
    hint: "Parçacık Sayısı'nı üst sınır olarak kullan; kapalıyken sayıyı yalnızca Aralık belirler.",
  },

  // paper geometry
  form: { label: "Form", hint: "Bir ya da birden çok seç; seçilen formlar eşit oranda karışır." },
  width: { label: "Genişlik" },
  height: { label: "Yükseklik" },
  useAspect: {
    label: "En-Boy Oranı Kullan",
    hint: "Yüksekliği paper.height yerine genişlik × oran ile hesapla.",
  },
  aspectRatio: { label: "En-Boy Oranı" },
  cornerRadius: { label: "Köşe Yarıçapı" },
  cornerPerCorner: {
    label: "Her Köşe Ayrı",
    hint: "Her köşeyi ayrı ayarla (yalnızca dikdörtgen ve kare).",
  },
  cornerTL: { label: "Sol Üst" },
  cornerTR: { label: "Sağ Üst" },
  cornerBR: { label: "Sağ Alt" },
  cornerBL: { label: "Sol Alt" },
  skew: {
    label: "Eğme",
    hint: "Her parçanın sabit eğimi; iki değer = aradaki rastgele bir eğim (en çok ±60°).",
  },

  // colors
  colorTheme: {
    label: "Tema",
    hint: "Aşağıdaki paleti hazır bir temayla doldur; sonra istediğin gibi düzenle.",
  },
  colors: {
    label: "Renkler",
    hint: "Düzenlemek için bir renge tıkla, eklemek için +, kaldırmak için ×.",
    empty: "Kütüphanenin Varsayılan Paleti",
  },
  colorMode: { label: "Renk Modu" },
  backColor: {
    label: "Arka Yüz Rengi",
    hint: 'Boş = "auto" (ön renk, Arka Yüz Gölgesi kadar koyulaşır). Geçersiz kılmak için renk ekle.',
    empty: "Otomatik · Koyu Ön Renk",
  },
  backShade: { label: "Arka Yüz Gölgesi" },
  gradient: { label: "Gradyan" },
  gradientColors: {
    label: "Gradyan Renkleri",
    hint: "Baştan sona eşit aralıklı, iki ya da daha fazla durak.",
    empty: "En Az İki Renk Ekle",
  },
  gradientAngle: { label: "Gradyan Açısı" },
  colorOverLife: { label: "Ömür Boyunca Renk" },
  colorOverLifeTo: { label: "Hedef Renk" },
  colorOverLifeEasing: { label: "Yumuşatma" },
  stroke: { label: "Kontur" },
  strokeColor: { label: "Kontur Rengi" },
  strokeWidth: { label: "Kontur Kalınlığı" },
  opacity: { label: "Opaklık" },
  blendMode: { label: "Karışım Modu" },

  // motion
  scale: { label: "Ölçek" },
  rotation: { label: "Başlangıç Dönüşü" },
  rotationSpeed: {
    label: "Dönüş Hızı",
    hint: "Saniyedeki derece cinsinden dönüş; negatif değerler ters yöne döndürür.",
  },
  flip: { label: "Takla" },
  flipAxis: { label: "Takla Ekseni" },
  flipFrequency: { label: "Takla Frekansı" },
  wobble: { label: "Salınım" },
  wobbleAmplitude: { label: "Salınım Genliği" },
  wobbleFrequency: { label: "Salınım Frekansı" },
  tilt: { label: "Yatma", hint: "Sallanan bir yatmanın genliği; işaret yok sayılır." },

  // life & effects
  fadeIn: { label: "Belirme", hint: "Ömrün belirerek geçen kısmı (oran)." },
  fadeOut: { label: "Kaybolma" },
  fadeStart: { label: "Kaybolma Başlangıcı" },
  fadeEasing: { label: "Kaybolma Yumuşatması" },
  scaleOverLife: { label: "Ömür Boyunca Ölçek" },
  scaleTo: { label: "Hedef Ölçek" },
  scaleEasing: { label: "Ölçek Yumuşatması" },
  shadow: { label: "Gölge" },
  shadowColor: { label: "Gölge Rengi" },
  shadowAlpha: { label: "Gölge Opaklığı" },
  shadowBlur: { label: "Gölge Bulanıklığı" },
  shadowX: { label: "Gölge Kayması X" },
  shadowY: { label: "Gölge Kayması Y" },
  shine: { label: "Parlama", hint: "Parçacık döndükçe üzerinden geçen parlak yansıma." },
  trail: { label: "İz", hint: "Her parçacığın arkasında, kuyruğa doğru incelip sönen bir çizgi." },
  trailLength: { label: "İz Uzunluğu", hint: "İzin geçtiği son konumlar (karede bir tane)." },
  trailWidth: { label: "İz Kalınlığı" },
  trailOpacity: { label: "İz Opaklığı" },
  trailCustomColor: {
    label: "Özel İz Rengi",
    hint: "Kapalı: her iz kendi parçacığının rengini alır.",
  },
  trailColor: { label: "İz Rengi" },

  // shape cards
  "star.points": { label: "Uç Sayısı" },
  "star.innerRatio": { label: "İç Oran" },
  "polygon.sides": { label: "Kenar Sayısı" },
  "ribbon.length": { label: "Uzunluk" },
  "ribbon.thickness": { label: "Kalınlık", hint: "Genişliğin uzunluğa oranı." },
  "ribbon.waves": { label: "Dalga" },
  "path.d": { label: "Path Verisi", hint: "viewBox içine çizilen SVG path `d` metni." },
  "path.viewBox": {
    label: "View Box Genişliği",
    hint: "Path'in çizim alanı; uzun kenarı Boyut'a ölçeklenir.",
  },
  "path.viewBoxHeight": { label: "View Box Yüksekliği" },
  "emoji.list": { label: "Emoji", hint: "Virgülle ayrılmış liste." },
  "emoji.fontFamily": { label: "Yazı Tipi" },
  "text.list": { label: "Metin", hint: "Virgülle ayrılmış liste." },
  "text.fontFamily": { label: "Yazı Tipi" },
  "text.fontWeight": { label: "Yazı Kalınlığı" },
  "image.src": {
    label: "Kaynak",
    hint: "Demo Canvas elementin kendisini, Demo URL bir blob URL metnini, Satır İçi SVG bir <svg> metnini, URL kendi adresini ya da data: URL'sini gönderir.",
  },
  "image.url": {
    label: "Görsel URL'si",
    hint: "Bir http(s) URL'si, data: URL'si ya da <svg> metni; yüklenen dosyanın aksine paylaşım bağlantısında taşınır. Başka sitelerdeki görseller yalnızca sunucuları CORS'a izin veriyorsa yüklenir.",
  },
  "image.tint": {
    label: "Renklendirme",
    hint: "Görseli parçacık renkleriyle boyar: Çoğalt gölgelendirmeyi korur (beyaz ve gri görseller renkleri en iyi alır), Doldur düz bir siluet çizer.",
  },
  "image.upload": {
    label: "Görsel Yükle",
    hint: "Herhangi bir görsel seç; object URL olarak gönderilir.",
  },
  "sprite.src": {
    label: "Kaynak",
    hint: "Kodla üretilmiş, 8 kareli dönen para (tek satır) ya da URL ile kendi sayfan.",
  },
  "sprite.url": {
    label: "Sayfa URL'si",
    hint: "Bir sprite sheet'in http(s) ya da data: URL'si; Sütun ve Satır'ı ona göre ayarla. Başka sitelerdeki sayfalar yalnızca sunucuları CORS'a izin veriyorsa yüklenir.",
  },
  "sprite.cols": { label: "Sütun" },
  "sprite.rows": { label: "Satır" },
  "sprite.tint": {
    label: "Renklendirme",
    hint: "Sayfayı parçacık renkleriyle boyar: Çoğalt gölgelendirmeyi korur (beyaz ve gri görseller renkleri en iyi alır), Doldur düz bir siluet çizer.",
  },
  "sprite.count": { label: "Kare Sayısı", hint: "0 = ızgaradaki tüm hücreler.", zero: "tümü" },
  "sprite.fps": { label: "Saniyedeki Kare" },
  "sprite.loop": { label: "Döngü" },
  "sprite.randomStart": { label: "Rastgele Başlangıç Karesi" },

  // physics
  gravity: { label: "Yerçekimi" },
  drag: { label: "Sürtünme" },
  wind: { label: "Rüzgar" },
  useTerminal: { label: "Limit Hız", hint: "Toplam hızı her yönde sınırlar." },
  terminalVelocity: { label: "Maks Hız" },
  swirl: { label: "Girdap" },
  swirlStrength: { label: "Girdap Gücü" },
  swirlFrequency: { label: "Girdap Frekansı" },
  floor: { label: "Zemin" },
  floorY: { label: "Zemin Y" },
  floorBounce: { label: "Sekme" },
  floorFriction: { label: "Zemin Sürtünmesi" },
  attract: {
    label: "Çekim",
    hint: "Parçacıkları bir hedefe çeker; negatif güç onları iter.",
  },
  attractTarget: { label: "Hedef" },
  attractX: { label: "Hedef X", hint: "Aralık verilebilir; çekim ortasına yönelir." },
  attractY: { label: "Hedef Y" },
  attractStrength: { label: "Güç", hint: "Negatif değerler parçacıkları iter (itici)." },
  attractRadius: { label: "Erişim", hint: "Çekimin ne kadar uzağa ulaştığı. 0 = tüm tuval." },
  attractFalloff: {
    label: "Zayıflama",
    hint: "Doğrusal: hedefte tam çekim, erişim sınırında sıfır.",
  },

  // hooks
  hookStart: { label: "Başlangıçta" },
  hookSpawn: { label: "Parçacık Doğunca" },
  hookUpdate: { label: "Parçacık Güncellenince", hint: "Her karede her parçacık için çalışır." },
  rainbow: {
    label: "Gökkuşağı Boyama",
    hint: "onParticleUpdate içinde frontColor'ı parçacığın yaşına göre değiştirir.",
  },
  hookDeath: { label: "Parçacık Ölünce" },
  hookComplete: { label: "Bitince" },
  logEvents: { label: "Konsola Yaz" },
};

/**
 * Turkish Section Text by Section Id.
 */
export const SECTIONS_TR: Readonly<Record<string, SectionText>> = {
  burst: { title: "Patlama" },
  emission: { title: "Atış Düzeni" },
  formation: {
    title: "Şekil Oluşturma",
    description:
      "Parçacıklar önce bir metin ya da görsel oluşturur, bir süre öyle durur, sonra dağılır.",
  },
  geometry: { title: "Kağıt Geometrisi" },
  colors: { title: "Renkler" },
  motion: { title: "Hareket" },
  life: { title: "Ömür ve Efektler" },
  shapes: {
    title: "Şekiller",
    description:
      "Ağırlıklı bir karışım için şekil türlerini aç. Hiçbiri açık değilse sadece kağıt atılır. Her şekil paper.* stil ayarlarını devralır; Gelişmiş modda bir kart kendi stilini belirleyebilir.",
  },
  physics: { title: "Fizik" },
  hooks: {
    title: "Hook'lar",
    description: "Yaşam döngüsü callback'leri üst çubuktaki sayaçları besler.",
  },
};

/**
 * Turkish Shape-Card Titles by Enable Key.
 */
export const CARDS_TR: Readonly<Record<string, string>> = {
  "paper.enabled": "Kağıt",
  "star.enabled": "Yıldız",
  "triangle.enabled": "Üçgen",
  "polygon.enabled": "Çokgen",
  "heart.enabled": "Kalp",
  "ribbon.enabled": "Kurdele",
  "path.enabled": "SVG Path",
  "emoji.enabled": "Emoji",
  "text.enabled": "Metin",
  "image.enabled": "Görsel",
  "sprite.enabled": "Sprite Sheet",
};

/**
 * Turkish Display Names for Option Values (easing names stay in English on purpose: they are standard terms).
 */
export const OPTION_LABELS_TR: Readonly<Record<string, string>> = {
  rect: "Dikdörtgen",
  square: "Kare",
  circle: "Daire",
  strip: "Şerit",
  leaf: "Yaprak",
  random: "Rastgele",
  sequence: "Sıralı",
  burst: "Tek Seferde",
  stream: "Akış",
  interval: "Aralıklı",
  x: "Yatay Eksen",
  y: "Dikey Eksen",
  both: "İki Eksen",
  "100": "İnce 100",
  "200": "Ekstra Hafif 200",
  "300": "Hafif 300",
  "400": "Normal 400",
  "500": "Orta 500",
  "600": "Yarı Kalın 600",
  "700": "Kalın 700",
  "800": "Ekstra Kalın 800",
  "900": "Çok Kalın 900",
  normal: "normal (CSS anahtar sözcüğü)",
  bold: "bold (CSS anahtar sözcüğü)",
  "demo canvas": "Demo Canvas",
  "demo url": "Demo URL",
  "inline svg": "Satır İçi SVG",
  url: "URL",
  custom: "Özel",
  classic: "Klasik",
  pastel: "Pastel",
  gold: "Altın",
  neon: "Neon",
  rainbow: "Gökkuşağı",
  winter: "Kış",
  autumn: "Sonbahar",
  ocean: "Okyanus",
  candy: "Şeker",
  forest: "Orman",
  monochrome: "Tek Renk",
  upload: "Yükleme",
  text: "Metin",
  image: "Görsel",
  "demo logo": "Demo Logo",
  assemble: "Toplanarak",
  appear: "Bir Anda",
  linear: "Doğrusal",
  pointer: "İmleç",
  point: "Nokta",
  constant: "Sabit",
  "source-over": "Normal",
  lighter: "Toplamalı",
  multiply: "Çoğalt",
  off: "Kapalı",
  fill: "Doldur",
  screen: "Ekran",
  overlay: "Bindirme",
  darken: "Koyulaştır",
  lighten: "Açıklaştır",
  "color-dodge": "Renk Soldurma",
  "color-burn": "Renk Yakma",
  "hard-light": "Sert Işık",
  "soft-light": "Yumuşak Işık",
  difference: "Fark",
  exclusion: "Hariç Tutma",
  hue: "Ton",
  saturation: "Doygunluk",
  color: "Renk",
  luminosity: "Parlaklık",
  xor: "XOR",
};

/**
 * Turkish Preset Names by `KonfetiPresets` Member.
 */
export const PRESETS_TR: Readonly<Record<string, string>> = {
  BASIC: "Temel",
  REALISTIC: "Gerçekçi",
  CANNON: "Top Atışı",
  FIREWORKS: "Havai Fişek",
  SCHOOL_PRIDE: "Okul Ruhu",
  SNOW: "Kar",
  STARS: "Yıldızlar",
  EMOJI_RAIN: "Emoji Yağmuru",
  HEART_BURST: "Kalp Patlaması",
  SIDE_SHOTS: "Yan Atışlar",
  SHOOTING_STARS: "Kayan Yıldızlar",
  MAGNET: "Mıknatıs",
  GOLDEN: "Altın",
  CONGRATS: "Tebrik Yazısı",
  LOGO_REVEAL: "Logo Gösterimi",
  JACKPOT: "Büyük İkramiye",
  LEVEL_UP: "Seviye Atlama",
  SUCCESS: "Başarılı",
  SPARKLER: "Maytap",
  FIREFLIES: "Ateş Böcekleri",
  FORCE_FIELD: "Kalkan",
};
