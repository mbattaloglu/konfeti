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
  colors: {
    label: "Renkleri Geçersiz Kıl",
    hint: "Boş = paper.colors renklerini kullanır.",
    empty: "Kağıt Renklerini Kullan",
  },
};

/**
 * Turkish Control Text by State Key.
 */
export const CONTROLS_TR: Readonly<Record<string, ControlText>> = {
  // burst
  particleCount: { label: "Parçacık Sayısı" },
  angle: { label: "Açı", hint: "Fırlatma yönü. 90 = dümdüz yukarı." },
  spread: { label: "Yayılma", hint: "Açının etrafındaki koninin genişliği." },
  velocityMin: { label: "Başlangıç Hızı Min" },
  velocityMax: { label: "Başlangıç Hızı Maks" },
  lifetime: {
    label: "Ömür",
    hint: "[değer × (1 − sapma), değer × (1 + sapma)] olarak gönderilir.",
  },
  lifetimeJitter: { label: "Ömür Sapması" },
  originX: { label: "Çıkış Noktası X" },
  originY: { label: "Çıkış Noktası Y" },
  originSpreadX: {
    label: "Çıkış X Yayılımı",
    hint: "0'dan büyükse origin.x, [x − v, x + v] aralığına dönüşür.",
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
  formationUpload: { label: "Görsel Yükle", hint: "Görselin opak pikselleri şekli oluşturur." },
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
  formationEasing: { label: "Toplanma Easing'i" },
  formationHold: { label: "Bekleme", hint: "Şeklin dağılmadan önce ekranda kalma süresi." },
  formationSpacing: {
    label: "Aralık",
    hint: "Parçacıklar arası mesafe: küçüldükçe şekil sıklaşır ve daha çok parçacık kullanılır.",
  },
  formationFit: {
    label: "Sığdırma",
    hint: "Tuvalin en fazla ne kadarını kaplayacağı; daha büyük bir şekil bütün olarak küçültülür.",
  },
  formationVelocityMin: { label: "Dağılma Hızı Min" },
  formationVelocityMax: { label: "Dağılma Hızı Maks" },

  // paper geometry
  form: { label: "Form", hint: "Bir ya da birden çok seç; seçilen formlar eşit oranda karışır." },
  widthMin: { label: "Genişlik Min" },
  widthMax: { label: "Genişlik Maks" },
  heightMin: { label: "Yükseklik Min" },
  heightMax: { label: "Yükseklik Maks" },
  useAspect: {
    label: "En-Boy Oranı Kullan",
    hint: "Yüksekliği paper.height yerine genişlik × oran ile hesapla.",
  },
  aspectRatio: { label: "En-Boy Oranı" },
  cornerRadius: { label: "Köşe Yarıçapı" },
  skew: { label: "Eğme", hint: "[-değer, değer] olarak gönderilir." },

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
  gradientA: { label: "Gradyan Başlangıcı" },
  gradientB: { label: "Gradyan Bitişi" },
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
  rotationMax: { label: "Başlangıç Dönüşü Maks", hint: "[0, değer] olarak gönderilir." },
  rotationSpeed: { label: "Dönüş Hızı", hint: "[-değer, değer] olarak gönderilir." },
  flip: { label: "Takla" },
  flipAxis: { label: "Takla Ekseni" },
  flipFrequency: { label: "Takla Frekansı" },
  wobble: { label: "Salınım" },
  wobbleAmplitude: { label: "Salınım Genliği" },
  wobbleFrequency: { label: "Salınım Frekansı" },
  tilt: { label: "Yatma", hint: "[-değer, değer] olarak gönderilir." },

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
  "path.viewBox": { label: "View Box", hint: "[değer, değer] olarak gönderilir." },
  "emoji.list": { label: "Emoji", hint: "Virgülle ayrılmış liste." },
  "text.list": { label: "Metin", hint: "Virgülle ayrılmış liste." },
  "text.fontFamily": { label: "Yazı Tipi" },
  "text.fontWeight": { label: "Yazı Kalınlığı" },
  "image.src": {
    label: "Kaynak",
    hint: "Demo Canvas elementin kendisini, Demo URL bir blob URL metnini, Satır İçi SVG bir <svg> metnini gönderir.",
  },
  "image.upload": {
    label: "Görsel Yükle",
    hint: "Herhangi bir görsel seç; object URL olarak gönderilir.",
  },
  "sprite.src": { label: "Kaynak", hint: "Kodla üretilmiş, 8 kareli dönen para (tek satır)." },
  "sprite.fps": { label: "Saniyedeki Kare" },
  "sprite.loop": { label: "Döngü" },
  "sprite.randomStart": { label: "Rastgele Başlangıç Karesi" },

  // physics
  gravity: { label: "Yerçekimi" },
  drag: { label: "Sürtünme" },
  wind: { label: "Rüzgar" },
  useTerminal: { label: "Limit Hız", hint: "Düşüş hızını sınırlar." },
  terminalVelocity: { label: "Maks Düşüş Hızı" },
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
      "Ağırlıklı bir karışım için şekil türlerini aç. Hiçbiri açık değilse sadece kağıt atılır. Her şekil paper.* stil ayarlarını devralır.",
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
  "400": "Normal",
  "700": "Kalın",
  "900": "Çok Kalın",
  "demo canvas": "Demo Canvas",
  "demo url": "Demo URL",
  "inline svg": "Satır İçi SVG",
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
  center: "Merkez",
  "top center": "Üst Orta",
  constant: "Sabit",
  "source-over": "Normal",
  lighter: "Toplamalı",
  multiply: "Çoğalt",
  screen: "Ekran",
  overlay: "Bindirme",
  difference: "Fark",
  exclusion: "Hariç Tutma",
  "color-dodge": "Renk Soldurma",
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
};
