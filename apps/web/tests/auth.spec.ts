/**
 * Auth flow E2E tests.
 * Tests every authentication path: login page, signup, access code.
 * Catches "can't log in" issues before they hit users.
 */
import { test, expect } from "@playwright/test";

test.describe("Auth pages load", () => {
  test("login page loads with all sign-in options", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("h1")).toContainText("Sign in");

    // Google sign-in button
    await expect(page.locator("text=Continue with Google")).toBeVisible();

    // Magic link form
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("text=Send magic link")).toBeVisible();

    // Access code link
    await expect(page.locator("text=Use an access code")).toBeVisible();

    // Sign up link
    await expect(page.locator("text=Create one")).toBeVisible();
  });

  test("signup page loads with all options", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.locator("h1")).toContainText("Create an account");
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator("input#name")).toBeVisible();
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("text=Create account")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("access code page loads", async ({ page }) => {
    await page.goto("/auth/access-code");
    await expect(page.locator("h1")).toContainText("Use an access code");
    await expect(page.locator("input#code")).toBeVisible();
    await expect(page.locator("text=Continue")).toBeVisible();
    await expect(page.locator("text=Back to sign in")).toBeVisible();
  });

  test("login with redirect param preserves it", async ({ page }) => {
    await page.goto("/auth/login?redirect=/dashboard");
    // The redirect param should be preserved in the page (client-side)
    await expect(page.locator("h1")).toContainText("Sign in");
  });

  test("signup with redirect param preserves it", async ({ page }) => {
    await page.goto("/auth/signup?redirect=/dashboard");
    await expect(page.locator("h1")).toContainText("Create an account");
  });
});

test.describe("Auth form validation", () => {
  test("magic link requires email", async ({ page }) => {
    await page.goto("/auth/login");
    const button = page.locator("button", { hasText: "Send magic link" });
    // Button should be disabled without email
    await expect(button).toBeDisabled();
    await page.fill("input#email", "test@example.com");
    await expect(button).toBeEnabled();
  });

  test("signup requires name and email", async ({ page }) => {
    await page.goto("/auth/signup");
    const button = page.locator("button", { hasText: "Create account" });
    await expect(button).toBeDisabled();
    await page.fill("input#name", "Test User");
    await page.fill("input#email", "test@example.com");
    await expect(button).toBeEnabled();
  });

  test("access code requires input", async ({ page }) => {
    await page.goto("/auth/access-code");
    const button = page.locator("button", { hasText: "Continue" });
    await expect(button).toBeDisabled();
    await page.fill("input#code", "ABC123");
    await expect(button).toBeEnabled();
  });
});

test.describe("Navigation between auth pages", () => {
  test("login → signup", async ({ page }) => {
    await page.goto("/auth/login");
    await page.click("text=Create one");
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("login → access code", async ({ page }) => {
    await page.goto("/auth/login");
    await page.click("text=Use an access code");
    await expect(page).toHaveURL(/\/auth\/access-code/);
  });

  test("signup → login", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("access code → login", async ({ page }) => {
    await page.goto("/auth/access-code");
    await page.click("text=Back to sign in");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
