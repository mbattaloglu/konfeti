/**
 * Runtime-Generated Demo Images (no asset files needed).
 */
export type DemoAssets = {
  /**
   * Coin Logo Canvas.
   */
  readonly coinCanvas: HTMLCanvasElement;
  /**
   * Coin Logo as Blob URL.
   */
  readonly coinUrl: string;
  /**
   * Spinning Coin Sprite Sheet Canvas (one row).
   */
  readonly sheetCanvas: HTMLCanvasElement;
  /**
   * Sprite Sheet as Blob URL.
   */
  readonly sheetUrl: string;
  /**
   * Frame Count in the Sprite Sheet.
   */
  readonly sheetFrames: number;
  /**
   * Colorful Demo Logo for Image Formations.
   */
  readonly logoCanvas: HTMLCanvasElement;
};

/**
 * Coin Canvas Edge Length.
 */
const COIN_SIZE = 96;

/**
 * Sprite Sheet Frame Edge Length.
 */
const FRAME_SIZE = 64;

/**
 * Sprite Sheet Frame Count.
 */
const FRAME_COUNT = 8;

/**
 * Demo Logo Size (three overlapping rings of color).
 */
const LOGO_SIZE = { width: 300, height: 140 } as const;

/**
 * Demo Logo Circle Colors, Left to Right.
 */
const LOGO_COLORS = ["#ff3d6e", "#18c7b8", "#ffb000"] as const;

/**
 * Create Canvas and 2D Context.
 *
 * @param width - Canvas Width
 * @param height - Canvas Height
 * @returns Canvas and Context
 */
function createCanvas(
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx === null) {
    throw new Error("playground: 2D context unavailable");
  }

  return { canvas, ctx };
}

/**
 * Draw Gold Coin Face.
 *
 * @param ctx - Target Context
 * @param cx - Center X
 * @param cy - Center Y
 * @param radius - Coin Radius
 * @param squash - Horizontal Scale (spin illusion, 0–1)
 */
function drawCoin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  squash: number,
): void {
  const rx = Math.max(radius * squash, radius * 0.08);
  const gradient = ctx.createLinearGradient(cx - rx, cy - radius, cx + rx, cy + radius);
  gradient.addColorStop(0, "#fff1a8");
  gradient.addColorStop(0.45, "#ffc93c");
  gradient.addColorStop(1, "#c7811a");

  // rim
  ctx.fillStyle = "#a8650f";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, radius, 0, 0, Math.PI * 2);
  ctx.fill();

  // face
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.86, radius * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();

  // logo letter only while the face is turned towards the viewer
  if (squash > 0.35) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(squash, 1);
    ctx.fillStyle = "#8a4f06";
    ctx.font = `900 ${Math.round(radius * 1.05)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("K", 0, radius * 0.06);
    ctx.restore();
  }
}

/**
 * Draw the Demo Logo: three overlapping discs, each in its own color, so image colors are easy to see.
 *
 * @returns Logo Canvas
 */
function drawLogo(): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(LOGO_SIZE.width, LOGO_SIZE.height);
  const radius = LOGO_SIZE.height * 0.46;
  const step = (LOGO_SIZE.width - radius * 2) / (LOGO_COLORS.length - 1);

  LOGO_COLORS.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(radius + step * index, LOGO_SIZE.height / 2, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas;
}

/**
 * Convert Canvas to Blob URL (falls back to a data URL).
 *
 * @param canvas - Source Canvas
 * @returns Object URL
 */
function toObjectUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob === null ? canvas.toDataURL() : URL.createObjectURL(blob));
    });
  });
}

/**
 * Generate Demo Coin Image and Spinning-Coin Sprite Sheet.
 *
 * @returns Demo Assets
 */
export async function createDemoAssets(): Promise<DemoAssets> {
  const coin = createCanvas(COIN_SIZE, COIN_SIZE);
  drawCoin(coin.ctx, COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE * 0.46, 1);

  const sheet = createCanvas(FRAME_SIZE * FRAME_COUNT, FRAME_SIZE);

  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    // half a turn across the sheet; |cos| keeps the face readable on both halves
    const squash = Math.abs(Math.cos((frame / FRAME_COUNT) * Math.PI));
    drawCoin(
      sheet.ctx,
      frame * FRAME_SIZE + FRAME_SIZE / 2,
      FRAME_SIZE / 2,
      FRAME_SIZE * 0.44,
      squash,
    );
  }

  const [coinUrl, sheetUrl] = await Promise.all([
    toObjectUrl(coin.canvas),
    toObjectUrl(sheet.canvas),
  ]);

  return {
    coinCanvas: coin.canvas,
    coinUrl,
    sheetCanvas: sheet.canvas,
    sheetUrl,
    sheetFrames: FRAME_COUNT,
    logoCanvas: drawLogo(),
  };
}
