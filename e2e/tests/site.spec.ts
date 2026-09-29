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
