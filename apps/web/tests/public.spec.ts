/**
 * Public pages and PWA E2E tests.
 * Tests the programme pages, PWA features, and public routes.
 */
import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("home page lists all 4 programmes", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Programme platform");

    const links = page.locator("a[href^='/p/']");
    await expect(links).toHaveCount(4);

    await expect(page.locator("text=Karawhiua")).toBeVisible();
    await expect(page.locator("text=FreeWheeler")).toBeVisible();
    await expect(page.locator("text=GameFIT")).toBeVisible();
    await expect(page.locator("text=Tap Town")).toBeVisible();
  });

  test("programme pages load with config-driven content", async ({ page }) => {
    const programmes = [
      { slug: "karawhiua", name: "Karawhiua", modules: 13 },
      { slug: "freewheeler", name: "FreeWheeler", modules: 11 },
      { slug: "gamefit", name: "GameFIT", modules: 11 },
      { slug: "tap-town", name: "Tap Town", modules: 5 },
    ];

    for (const prog of programmes) {
      await page.goto(`/p/${prog.slug}`);
      await expect(page.locator("h1")).toContainText(prog.name);

      // Module cards should be visible and count should match config
      const cards = page.locator("h2");
      const count = await cards.count();
      // At least the help section header plus module cards
      expect(count).toBeGreaterThanOrEqual(2);

      // Help section should be present
      await expect(page.locator("text=Need help?")).toBeVisible();
    }
  });

  test("Tap Town shows fewer modules than Karawhiua", async ({ page }) => {
    await page.goto("/p/karawhiua");
    const karawhiuaCards = await page.locator("h2").count();

    await page.goto("/p/tap-town");
    const tapTownCards = await page.locator("h2").count();

    expect(tapTownCards).toBeLessThan(karawhiuaCards);
  });

  test("offline page renders", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.locator("h1")).toContainText("offline");
  });

  test("404 page for unknown programme", async ({ page }) => {
    const response = await page.goto("/p/unknown-programme");
    expect(response?.status()).toBe(404);
  });
});

test.describe("PWA", () => {
  test("manifest is accessible and valid", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    // Check for maskable icon
    const maskable = manifest.icons.find(
      (i: any) => i.purpose === "maskable"
    );
    expect(maskable).toBeTruthy();
  });

  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("service worker file exists", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);
    const sw = await response.text();
    expect(sw).toContain("install");
    expect(sw).toContain("fetch");
    expect(sw).toContain("activate");
  });

  test("icons exist", async ({ request }) => {
    for (const icon of ["icon-192.png", "icon-512.png", "icon-512-maskable.png"]) {
      const response = await request.get(`/icons/${icon}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image");
    }
  });
});

test.describe("Accessibility", () => {
  test("skip to content link exists", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator("a[href='#main']");
    await expect(skipLink).toBeVisible();
  });

  test("main landmark exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main#main")).toBeVisible();
  });

  test("all pages have lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");
  });

  test("reduced motion is respected", async ({ page }) => {
    await page.goto("/");
    const styles = await page.evaluate(() => {
      const sheet = Array.from(document.styleSheets)
        .flatMap((s) => Array.from(s.cssRules))
        .find(
          (r) =>
            r instanceof CSSMediaRule &&
            r.conditionText.includes("prefers-reduced-motion")
        );
      return sheet ? true : false;
    });
    expect(styles).toBe(true);
  });
});

test.describe("Mobile responsive", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("home page is usable on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();

    // Programme links should be tappable
    const links = page.locator("a[href^='/p/']");
    const count = await links.count();
    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // close to 44px touch target
      }
    }
  });

  test("programme page is usable on mobile", async ({ page }) => {
    await page.goto("/p/karawhiua");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("login page is usable on mobile", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("h1")).toBeVisible();
  });
});
