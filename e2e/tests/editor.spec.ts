import type { Locator, Page } from "@playwright/test";

import { expect, openSite, ORIGIN, test } from "../support/site";

/**
 * Point in Viewport Coordinates.
 */
type Point = {
  /**
   * Horizontal Position.
   */
  readonly x: number;
  /**
   * Vertical Position.
   */
  readonly y: number;
};

/**
 * Where to Press Between Two Lifetime Thumbs, and How Far Apart They Are Drawn.
 */
type ThumbPair = Point & {
  /**
   * Distance Between the Two Thumb Centres.
   */
  readonly gap: number;
};

/**
 * The Playground's Module Bundle in the Built Site.
 */
const PLAYGROUND_BUNDLE = /\/assets\/playground-[^/]+\.js$/;

/**
 * Edge Length of a Slider Thumb (`.slider::-webkit-slider-thumb`).
 */
const THUMB_PX = 12;

/**
 * Pointer Travel of the Drag Tests.
 */
const DRAG_PX = 40;

/**
 * Moves an Emulated Touch Drag Is Split Into.
 */
const TOUCH_DRAG_STEPS = 8;

/**
 * Thumb Gap Below Which a Small Touch Counts as Overlapping at Page Scale 1 (a thumb plus a 20 px touch area).
 */
const TOUCH_OVERLAP_AT_SCALE_1_PX = 32;

/**
 * Press Height above the Track Line (still on the thumbs, off the fill line).
 */
const ABOVE_LINE_PX = 3;

/**
 * Sub-Pixel Rounding Allowed in Layout Comparisons.
 */
const LAYOUT_TOLERANCE_PX = 0.5;

/**
 * Phone Viewport, Where the Panel Is Narrowest.
 */
const PHONE = { width: 390, height: 844 } as const;

/**
 * Narrow Android Viewport.
 */
const SMALL_PHONE = { width: 360, height: 800 } as const;

/**
 * Lifetime Slider Bounds in Milliseconds (`controls.ts`).
 */
const LIFETIME_SLIDER = { min: 100, max: 12000 } as const;

/**
 * Lifetime Bounds Drawn 17 px Apart on a 390 px Panel (apart for a mouse, within a touch's reach).
 */
const CLOSE_LIFETIME = [2800, 4000] as const;

/**
 * Lifetime Bounds Drawn 41 CSS px Apart on a Phone (beyond a touch's reach at page scale 1, not when zoomed out).
 */
const PHONE_LIFETIME = [2800, 4400] as const;

/**
 * `KonfetiPalettes.GOLD`, Which the Gold Theme Fills In.
 */
const GOLD_PALETTE = ["#ffd700", "#ffcc33", "#f5b700", "#e6be8a", "#fff1b8", "#c9a227"];

/**
 * Read the Two Bounds of a Span Readout (`"100 – 3600 ms"`; a single value gives both).
 *
 * @param readout - Readout Element
 * @returns Lower and Upper Bound
 */
async function boundsOf(readout: Locator): Promise<readonly [number, number]> {
  const numbers = (await readout.innerText()).match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const [low = Number.NaN, high = low] = numbers;

  return [low, high];
}

/**
 * Return the Viewport Box of a Span Track, Scrolled into View.
 *
 * @param row - Control Row
 * @returns Track Box
 */
async function trackBox(
  row: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  await row.scrollIntoViewIfNeeded();
  const box = await row.locator(".span-slider").boundingBox();

  if (box === null) {
    throw new Error("the span track is not rendered");
  }

  return box;
}

/**
 * Return the Press Point Halfway Between Two Lifetime Thumbs (a little above the track line) and Their Gap.
 * Measured in the page, in the CSS pixels mouse and emulated touch input use, also on a zoomed-out phone page.
 *
 * @param row - Lifetime Control Row
 * @param low - Lower Bound in Milliseconds
 * @param high - Upper Bound in Milliseconds
 * @returns Press Point and Thumb Gap
 */
async function lifetimeThumbs(row: Locator, low: number, high: number): Promise<ThumbPair> {
  await row.scrollIntoViewIfNeeded();
  const box = await row.locator(".span-slider").evaluate((track) => {
    const { x, y, width, height } = track.getBoundingClientRect();

    return { x, y, width, height };
  });
  const centreOf = (value: number): number =>
    box.x +
    THUMB_PX / 2 +
    ((value - LIFETIME_SLIDER.min) / (LIFETIME_SLIDER.max - LIFETIME_SLIDER.min)) *
      (box.width - THUMB_PX);

  return {
    x: (centreOf(low) + centreOf(high)) / 2,
    y: box.y + box.height / 2 - ABOVE_LINE_PX,
    gap: centreOf(high) - centreOf(low),
  };
}

/**
 * Drag the Mouse Sideways from a Point.
 *
 * @param page - Page
 * @param x - Start X
 * @param y - Start Y
 * @param dx - Horizontal Travel
 */
async function dragFrom(page: Page, x: number, y: number, dx: number): Promise<void> {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 8 });
  await page.mouse.up();
}

/**
 * Drag One Emulated Touch Sideways from a Point.
 * Sent through the DevTools protocol, so the browser routes the touch to its target as for a real finger.
 *
 * @param page - Page
 * @param from - Start Point
 * @param dx - Horizontal Travel
 */
async function touchDragFrom(page: Page, from: Point, dx: number): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: from.x, y: from.y }],
  });

  for (let step = 1; step <= TOUCH_DRAG_STEPS; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: from.x + (dx * step) / TOUCH_DRAG_STEPS, y: from.y }],
    });
  }

  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

/**
 * Open the Editor with One Burst's Settings from a v2 Share Link.
 *
 * @param page - Page
 * @param burst - Changed Settings of the Burst
 */
async function openWithBurst(page: Page, burst: Record<string, unknown>): Promise<void> {
  const link = Buffer.from(JSON.stringify({ v: 2, b: [burst] })).toString("base64url");
  await page.goto(`${ORIGIN}/tools/konfeti/?lang=en&s=${link}`);
}

/**
 * Open a Section of the Controls Panel (sections other than Burst start closed).
 *
 * @param page - Page
 * @param id - Section Id (`data-section`)
 */
async function openSection(page: Page, id: string): Promise<void> {
  const details = page.locator(`details[data-section="${id}"]`);

  if ((await details.getAttribute("open")) === null) {
    await details.locator("> summary").click();
  }

  await expect(details).toHaveAttribute("open", "");
}

/**
 * Read the Physics Options the JSON Panel Shows (the minimal build Fire sends).
 *
 * @param page - Page
 * @returns `physics` of the Fire Options, or Undefined When None Is Sent
 */
async function physicsOf(page: Page): Promise<Record<string, unknown> | undefined> {
  const options = JSON.parse(await page.locator("#json").inputValue()) as {
    physics?: Record<string, unknown>;
  };

  return options.physics;
}

test.describe("built site (editor)", () => {
  test("the Basic / Advanced switch hides advanced controls and is remembered", async ({
    page,
    site,
  }) => {
    await openSite(page, "");
    const delay = page.locator('[data-key="delay"]');
    const advanced = page.locator('#editor-mode [data-mode="advanced"]');

    // the attribute contract, then the style that acts on it
    await expect(page.locator("#tab-controls")).toHaveAttribute("data-mode", "basic");
    await expect(delay).toHaveAttribute("data-advanced");
    await expect(delay).toHaveCSS("display", "none");

    await advanced.click();
    await expect(page.locator("#tab-controls")).toHaveAttribute("data-mode", "advanced");
    await expect(delay).not.toHaveCSS("display", "none");

    // the module bundle is held back on the reload: only the page's inline script can show the remembered mode
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(PLAYGROUND_BUNDLE, async (route) => {
      await held;
      await route.fallback();
    });
    await page.reload({ waitUntil: "commit" });
    await expect(advanced).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('#editor-mode [data-mode="basic"]')).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.locator("#tab-controls")).toHaveAttribute("data-mode", "advanced");
    // the module has not run yet: it renders the preset cards
    await expect(page.locator("button.preset")).toHaveCount(0);
    release();

    await expect(page.locator("button.preset").first()).toBeVisible();
    await expect(advanced).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#tab-controls")).toHaveAttribute("data-mode", "advanced");
    expect(site.errors).toEqual([]);
  });

  test("an old v1 share link still opens", async ({ page, site }) => {
    const v1 = Buffer.from(JSON.stringify({ particleCount: 123, lifetime: 5000 })).toString(
      "base64url",
    );
    await page.goto(`${ORIGIN}/tools/konfeti/?lang=en&s=${v1}`);

    await expect(page.locator('[data-key="particleCount"] input[type="range"]')).toHaveValue("123");
    // v1 lifetime 5000 with its 15 % jitter
    await expect(page.locator('[data-key="lifetime"] output.control-value')).toHaveText(
      "4250 – 5750 ms",
    );
    expect(site.errors).toEqual([]);
  });

  test("a span value can be typed exactly", async ({ page, site }) => {
    await openSite(page, "");
    await openSection(page, "physics");
    const gravity = page.locator('[data-key="gravity"]');
    const fields = gravity.locator(".value-input");

    await gravity.locator(".control-value-edit").click();
    await expect(fields.first()).toBeFocused();
    // the max field follows the min field while both hold one value
    await page.keyboard.type("-8");
    await expect(fields.nth(1)).toHaveValue("-8");
    await page.keyboard.press("Enter");
    await expect(gravity.locator("output.control-value")).toHaveText("-8 px/s²");
    expect((await physicsOf(page))?.["gravity"]).toBe(-8);

    await gravity.locator(".control-value-edit").click();
    await fields.nth(0).fill("-1");
    await fields.nth(1).fill("5");
    await page.keyboard.press("Enter");
    await expect(gravity.locator("output.control-value")).toHaveText("-1 – 5 px/s²");
    expect((await physicsOf(page))?.["gravity"]).toEqual([-1, 5]);

    // out of domain: the library rejects a negative delay, so the entry stays open and marked
    await page.locator('#editor-mode [data-mode="advanced"]').click();
    await openSection(page, "emission");
    const delay = page.locator('[data-key="delay"]');
    await delay.locator(".control-value-edit").click();
    await page.keyboard.type("-1");
    await page.keyboard.press("Enter");
    await expect(delay.locator(".value-input")).toHaveAttribute("aria-invalid", "true");
    await page.keyboard.press("Escape");
    await expect(delay.locator("output.control-value")).toHaveText("0 ms");
    expect(site.errors).toEqual([]);
  });

  test("a span thumb takes a press at its exact centre", async ({ page, site }) => {
    await openSite(page, "");
    await page.locator('#editor-mode [data-mode="advanced"]').click();
    await openSection(page, "motion");
    const rotation = page.locator('[data-key="rotation"]');
    const box = await trackBox(rotation);
    // 0 and 360 on the −360–360 slider: the accent fill line runs through both thumb centres
    const centreOf = (ratio: number): { x: number; y: number } => ({
      x: box.x + THUMB_PX / 2 + ratio * (box.width - THUMB_PX),
      y: box.y + box.height / 2,
    });

    for (const [thumb, ratio] of [
      ["min", 0.5],
      ["max", 1],
    ] as const) {
      const { x, y } = centreOf(ratio);
      const hit = await page.evaluate(
        ([px, py]) => document.elementFromPoint(px, py)?.getAttribute("data-thumb") ?? null,
        [x, y] as const,
      );

      expect(hit, thumb).toBe(thumb);
    }

    const max = centreOf(1);
    await dragFrom(page, max.x, max.y, -DRAG_PX);
    const [low, high] = await boundsOf(rotation.locator("output.control-value"));

    expect(low).toBe(0);
    expect(high).toBeLessThan(360);
    expect(site.errors).toEqual([]);
  });

  test("overlapping thumbs on a narrow panel split by the drag direction", async ({
    page,
    site,
  }) => {
    await page.setViewportSize(PHONE);
    await openSite(page, "");
    const lifetime = page.locator('[data-key="lifetime"]');
    const readout = lifetime.locator("output.control-value");
    // 2800 and 3600 ms: on this narrow track the two thumbs overlap and look like one block
    const dragBlock = async (dx: number): Promise<void> => {
      // pressed between the two centres, a little above the line
      const { x, y } = await lifetimeThumbs(lifetime, 2800, 3600);
      await dragFrom(page, x, y, dx);
    };

    await expect(readout).toHaveText("2800 – 3600 ms");
    await dragBlock(-DRAG_PX);
    const [lowered, kept] = await boundsOf(readout);

    expect(lowered).toBeLessThan(2800);
    expect(kept).toBe(3600);

    await page.locator("#reset-controls").click();
    await expect(readout).toHaveText("2800 – 3600 ms");
    await dragBlock(DRAG_PX);
    const [unchanged, raised] = await boundsOf(readout);

    expect(unchanged).toBe(2800);
    expect(raised).toBeGreaterThan(3600);
    expect(site.errors).toEqual([]);
  });

  test("a preset loads into the editor, shows its chip and knows when it was edited", async ({
    page,
    site,
  }) => {
    await openSite(page, "");
    const card = page.locator("button.preset", {
      has: page.locator("code", { hasText: /^SNOW$/ }),
    });
    const chip = page.locator("#preset-chip");
    const edited = page.locator("#preset-chip-edited");
    const json = async (): Promise<Record<string, unknown>> =>
      JSON.parse(await page.locator("#json").inputValue()) as Record<string, unknown>;

    await card.click();
    await expect(chip).toBeVisible();
    await expect(page.locator("#preset-chip-name")).toHaveText("SNOW");
    await expect(card).toHaveAttribute("aria-current", "true");
    await expect(edited).toBeHidden();
    expect((await json())["particleCount"]).toBe(180);

    // an unchanged preset is written as itself
    await page.locator('.panel-tab[data-tab="export"]').click();
    await expect(page.locator("#code-preview")).toContainText("Konfeti.fire(KonfetiPresets.SNOW);");
    await page.locator('.panel-tab[data-tab="controls"]').click();

    const count = page.locator('[data-key="particleCount"]');
    await count.locator(".control-value-edit").click();
    await page.keyboard.type("90");
    await page.keyboard.press("Enter");
    await expect(edited).toBeVisible();
    await count.locator(".control-value-edit").click();
    await page.keyboard.type("180");
    await page.keyboard.press("Enter");
    await expect(edited).toBeHidden();

    await page.locator("#preset-clear").click();
    await expect(chip).toBeHidden();
    await expect(card).not.toHaveAttribute("aria-current", "true");
    expect(await json()).toEqual({});
    await expect(page.locator(".toast.is-error")).toHaveCount(0);
    expect(site.errors).toEqual([]);
  });

  test("a list preset becomes burst tabs, and its own link is not edited", async ({
    page,
    site,
  }) => {
    await openSite(page, "");
    await page.locator('#editor-mode [data-mode="advanced"]').click();
    await page
      .locator("button.preset", { has: page.locator("code", { hasText: /^REALISTIC$/ }) })
      .click();
    await expect(page.locator('#burst-tabs [role="tab"]')).toHaveCount(5);
    await page.locator("#burst-tab-3").click();
    await expect(page.locator("#preset-chip-edited")).toBeHidden();

    await page.locator('.panel-tab[data-tab="export"]').click();
    const link = await page.locator("#share-link").inputValue();
    await page.goto(link);
    await expect(page.locator("#preset-chip-name")).toHaveText("REALISTIC");
    await expect(page.locator("#preset-chip-edited")).toBeHidden();
    await expect(page.locator('#burst-tabs [role="tab"]')).toHaveCount(5);

    // pasted JSON loads into the controls (and no preset is held then)
    await page.locator('.panel-tab[data-tab="export"]').click();
    await page.locator("#json").fill('{ "particleCount": 77, "shapes": [{ "type": "star" }] }');
    await page.locator("#load-json").click();
    await expect(page.locator('#burst-tabs [role="tab"]')).toHaveCount(1);
    await expect(page.locator("#preset-chip")).toBeHidden();
    await expect(page.locator('[data-key="star.enabled"]')).toHaveClass(/is-enabled/);
    expect(site.errors).toEqual([]);
  });

  test("several bursts fire as a list and travel in the share link", async ({ page, site }) => {
    await openSite(page, "");
    await page.locator('#editor-mode [data-mode="advanced"]').click();
    await page.locator("#burst-add").click();
    await expect(page.locator('#burst-tabs [role="tab"]')).toHaveCount(2);
    await expect(page.locator("#burst-tab-2")).toHaveAttribute("aria-selected", "true");

    const count = page.locator('[data-key="particleCount"]');
    await count.locator(".control-value-edit").click();
    await page.keyboard.type("123");
    await page.keyboard.press("Enter");
    const json = async (): Promise<unknown> =>
      JSON.parse(await page.locator("#json").inputValue()) as unknown;
    await expect.poll(json).toEqual([{}, { particleCount: 123 }]);

    // the first tab still holds its own burst
    await page.locator("#burst-tab-1").click();
    await expect(count.locator("output.control-value")).toHaveText("60");

    await page.locator('.panel-tab[data-tab="export"]').click();
    const link = await page.locator("#share-link").inputValue();
    await page.goto(link);
    await expect(page.locator('#burst-tabs [role="tab"]')).toHaveCount(2);
    await expect.poll(json).toEqual([{}, { particleCount: 123 }]);
    expect(site.errors).toEqual([]);
  });

  test("a card sets its own style in Advanced mode", async ({ page, site }) => {
    await openSite(page, "");
    await page.locator('#editor-mode [data-mode="advanced"]').click();
    await openSection(page, "shapes");
    await page.locator('[data-key="star.enabled"] .card-header').click();
    const area = page.locator('[data-key="star.styles"]');
    await area.locator(".override-picker").selectOption("trail");
    await area.locator(".override-add").click();
    const shapes = async (): Promise<unknown> =>
      (JSON.parse(await page.locator("#json").inputValue()) as { shapes?: unknown }).shapes;

    // a new group starts at what the star already had, so the options do not change
    await expect.poll(shapes).toEqual([{ type: "star" }]);
    await area.locator('[data-key="star.trail"] .switch').click();
    await expect.poll(shapes).toEqual([{ type: "star", trail: true }]);

    await area.locator('[data-style="trail"] .override-remove').click();
    await expect.poll(shapes).toEqual([{ type: "star" }]);
    await expect(area.locator('[data-style="trail"]')).toHaveCount(0);
    expect(site.errors).toEqual([]);
  });

  test("an open value editor fits its row on a narrow phone", async ({ page, site }) => {
    await page.setViewportSize(SMALL_PHONE);
    await openSite(page, "");
    await openSection(page, "shapes");
    await page.locator('[data-key="star.enabled"] .card-header').click();
    const size = page.locator('[data-key="star.size"]');
    await size.locator(".control-value-edit").click();
    const editor = await size.locator(".value-editor").boundingBox();
    const head = await size.locator(".control-head").boundingBox();

    expect(editor).not.toBeNull();
    expect(head).not.toBeNull();
    // the two fields shrink instead of running past the card border
    expect((editor?.x ?? 0) + (editor?.width ?? 0)).toBeLessThanOrEqual(
      (head?.x ?? 0) + (head?.width ?? 0) + LAYOUT_TOLERANCE_PX,
    );
    expect(site.errors).toEqual([]);
  });

  test("the theme follows the colors, and a theme fills them in", async ({ page, site }) => {
    await openSite(page, "");
    await openSection(page, "colors");
    const theme = page.locator('[data-key="colorTheme"] select');

    await expect(theme).toHaveValue("classic");
    await expect(theme.locator('option[value="custom"]')).toBeDisabled();

    await page.locator('[data-key="colors"] .palette-remove').first().click();
    await expect(theme).toHaveValue("custom");

    await theme.selectOption("gold");
    await expect(theme).toHaveValue("gold");
    await expect
      .poll(async () => {
        const options = JSON.parse(await page.locator("#json").inputValue()) as {
          paper?: { colors?: unknown };
        };

        return options.paper?.colors;
      })
      .toEqual(GOLD_PALETTE);
    expect(site.errors).toEqual([]);
  });
});

test.describe("built site (editor, touch)", () => {
  test.use({ hasTouch: true, viewport: PHONE });

  test("a touch drag between close thumbs moves the bound it heads for", async ({ page, site }) => {
    await openWithBurst(page, { lifetime: CLOSE_LIFETIME });
    const lifetime = page.locator('[data-key="lifetime"]');
    const readout = lifetime.locator("output.control-value");

    await expect(readout).toHaveText("2800 – 4000 ms");
    // apart for a mouse, but a touch between them reaches both thumbs and the browser hands it to the upper one
    await touchDragFrom(page, await lifetimeThumbs(lifetime, ...CLOSE_LIFETIME), -DRAG_PX);
    await expect(readout).not.toHaveText("2800 – 4000 ms");
    const [lowered, kept] = await boundsOf(readout);

    expect(lowered).toBeLessThan(2800);
    expect(kept).toBe(4000);
    expect(site.errors).toEqual([]);
  });

  test.describe("on a phone", () => {
    // the page's 1024 px viewport meta applies, so the layout is shown zoomed out
    test.use({ isMobile: true });

    test("a touch reaches further on the zoomed-out page", async ({ page, site }) => {
      await openWithBurst(page, { lifetime: PHONE_LIFETIME });
      const lifetime = page.locator('[data-key="lifetime"]');
      const readout = lifetime.locator("output.control-value");

      await expect(readout).toHaveText("2800 – 4400 ms");
      const thumbs = await lifetimeThumbs(lifetime, ...PHONE_LIFETIME);

      // the touch area is set in screen pixels, so zoomed out it spans more CSS pixels than at scale 1
      expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBeLessThan(1);
      expect(thumbs.gap).toBeGreaterThan(TOUCH_OVERLAP_AT_SCALE_1_PX);

      await touchDragFrom(page, thumbs, -DRAG_PX);
      await expect(readout).not.toHaveText("2800 – 4400 ms");
      const [lowered, kept] = await boundsOf(readout);

      expect(lowered).toBeLessThan(2800);
      expect(kept).toBe(4400);
      expect(site.errors).toEqual([]);
    });
  });
});
