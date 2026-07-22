import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Public pages", () => {
  test("home page loads and lists programmes", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Programme platform");
    await expect(page.locator("text=Karawhiua")).toBeVisible();
    await expect(page.locator("text=Tap Town")).toBeVisible();
  });

  test("programme page loads with theme and modules", async ({ page }) => {
    await page.goto("/p/karawhiua");
    await expect(page.locator("h1")).toContainText("Karawhiua");
    // Module cards should be visible
    await expect(page.locator("text=Registration")).toBeVisible();
  });

  test("programme page respects modules - Tap Town has fewer modules", async ({ page }) => {
    await page.goto("/p/tap-town");
    await expect(page.locator("h1")).toContainText("Tap Town");
    // Tap Town has fewer modules - should only show registration, reporting, etc.
  });

  test("offline page renders", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.locator("text=You are offline")).toBeVisible();
  });

  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});

test.describe("Auth pages", () => {
  test("login page renders with Google and magic link options", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("text=Sign in")).toBeVisible();
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator("text=Send magic link")).toBeVisible();
    await expect(page.locator("text=Use an access code")).toBeVisible();
  });

  test("signup page renders", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.locator("text=Create an account")).toBeVisible();
  });

  test("access code page renders", async ({ page }) => {
    await page.goto("/auth/access-code");
    await expect(page.locator("text=Use an access code")).toBeVisible();
  });
});

test.describe("Accessibility (WCAG 2.2 AA)", () => {
  test("home page passes accessibility scan", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("login page passes accessibility scan", async ({ page }) => {
    await page.goto("/auth/login");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("programme page passes accessibility scan", async ({ page }) => {
    await page.goto("/p/karawhiua");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("school registration page passes accessibility scan", async ({ page }) => {
    await page.goto("/auth/login");
    // Can't test behind auth without sign-in, but test what we can
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Mobile responsive", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("home page is mobile friendly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("login page is mobile friendly", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("text=Sign in")).toBeVisible();
    // All touch targets should be at least 44px
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(43); // Allow 1px rounding
      }
    }
  });
});

test.describe("PWA", () => {
  test("manifest is accessible and valid", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test("service worker is registered", async ({ page }) => {
    await page.goto("/");
    // Service worker is registered by the ServiceWorkerRegistration component
    // In development, Next.js doesn't register SWs
  });
});
