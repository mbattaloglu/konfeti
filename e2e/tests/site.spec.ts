import { expect, openSite, test } from "../support/site";

test.describe("built site (playground)", () => {
  test("every preset fires without an error toast", async ({ page, site }) => {
    await openSite(page, "");
    const presets = page.locator("button.preset");
    await expect(presets.first()).toBeVisible();
    const toast = page.locator("#toast");
    const failures: string[] = [];

    for (const preset of await presets.all()) {
      await preset.click();
      // the toast only shows up for errors here (presets have no success message)
      if (await toast.evaluate((element) => element.classList.contains("is-error"))) {
        failures.push(`${await preset.innerText()}: ${await toast.innerText()}`);
        await toast.evaluate((element) => {
          element.classList.remove("is-error", "is-visible");
        });
      }
    }

    expect(failures).toEqual([]);
    expect(site.errors).toEqual([]);
  });
});

test.describe("built site (docs)", () => {
  test("the language switch changes the guide to Turkish and back", async ({ page, site }) => {
    await openSite(page, "docs/");
    await expect(page.locator("#docs-content h2").first()).toContainText("API at a glance");

    await page.locator(".lang-switch button", { hasText: "TR" }).click();
    await expect(page.locator("#docs-content h2").first()).toContainText("Bir bakışta API");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");

    await page.locator(".lang-switch button", { hasText: "EN" }).click();
    await expect(page.locator("#docs-content h2").first()).toContainText("API at a glance");
    expect(site.errors).toEqual([]);
  });
});

test.describe("built site (language switch after following a section link)", () => {
  test("switches even when the URL has a #section", async ({ page }) => {
    // no ?lang= in the URL: the pick is stored, so only the #hash differs after switching
    await page.goto("http://konfeti.test/tools/konfeti/docs/#shapes");
    await page.locator(".lang-switch button", { hasText: "EN" }).click();
    await expect(page.locator("#docs-content h2").first()).toContainText("API at a glance");

    await page.locator("#docs-toc a").nth(2).click();
    await expect(page).toHaveURL(/#/);
    await page.locator(".lang-switch button", { hasText: "TR" }).click();

    await expect(page.locator("#docs-content h2").first()).toContainText("Bir bakışta API");
    await expect(page).not.toHaveURL(/#/);
  });
});
