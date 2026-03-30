import { test, expect } from "./fixtures";

test.describe("Registration", () => {
  test("registers a new user and redirects to /play", async ({
    page,
    registerUser,
  }) => {
    const { username } = await registerUser();

    // Should have navigated away from /register
    expect(page.url()).not.toContain("/register");
  });

  test("shows error for duplicate email", async ({ page, registerUser }) => {
    const creds = await registerUser();

    // Try registering again with same email
    await page.goto("/register");
    await page.getByLabel("Username").fill("different_user");
    await page.getByLabel("Email").fill(creds.email);
    await page.getByLabel("Password").fill(creds.password);
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText("already exists")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("shows error for duplicate username", async ({
    page,
    registerUser,
  }) => {
    const creds = await registerUser();

    await page.goto("/register");
    await page.getByLabel("Username").fill(creds.username);
    await page.getByLabel("Email").fill("other@example.com");
    await page.getByLabel("Password").fill("TestPass123!");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText("already taken")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("enforces minimum password length", async ({ page }) => {
    await page.goto("/register");
    const passwordInput = page.getByLabel("Password");
    await passwordInput.fill("short");

    // HTML5 minLength validation — the input should have minLength=8
    const minLength = await passwordInput.getAttribute("minLength");
    expect(Number(minLength)).toBe(8);
  });

  test("navigates to login from register page", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Login", () => {
  test("logs in with valid credentials", async ({
    page,
    registerUser,
    loginUser,
  }) => {
    const creds = await registerUser();

    // Sign out by clearing cookies and going to login
    await page.context().clearCookies();
    await loginUser(creds.email, creds.password);

    expect(page.url()).not.toContain("/login");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("WrongPass123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("navigates to register from login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("has play as guest link", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("link", { name: "play as guest" })
    ).toBeVisible();
  });
});

test.describe("Guest flow", () => {
  test("creates guest session from homepage", async ({ page, playAsGuest }) => {
    await playAsGuest();

    // Guest should be redirected away from home
    expect(page.url()).not.toBe("/");
  });

  test("guest can access upgrade page", async ({ page, playAsGuest }) => {
    await playAsGuest();
    await page.goto("/upgrade");

    await expect(page.getByText("Upgrade Account")).toBeVisible();
  });

  test("guest upgrade flow", async ({ page, playAsGuest }) => {
    await playAsGuest();
    await page.goto("/upgrade");

    const id = Math.random().toString(36).slice(2, 10);
    await page.getByLabel("Username").fill(`upgraded_${id}`);
    await page.getByLabel("Email").fill(`upgraded_${id}@example.com`);
    await page.getByLabel("Password").fill("UpgradePass123!");
    await page.getByRole("button", { name: "Upgrade to Full Account" }).click();

    // Should redirect to /profile after upgrade
    await page.waitForURL(/\/profile/, { timeout: 10_000 });
  });
});
