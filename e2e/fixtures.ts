import { test as base, expect, type Page } from "@playwright/test";

/**
 * Registers a new user via the API and signs them in via the UI.
 * Returns the credentials used.
 */
async function registerUser(
  page: Page,
  overrides: { username?: string; email?: string; password?: string } = {}
) {
  const id = Math.random().toString(36).slice(2, 10);
  const username = overrides.username ?? `test_${id}`;
  const email = overrides.email ?? `test_${id}@example.com`;
  const password = overrides.password ?? "TestPass123!";

  await page.goto("/register");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();

  // Wait for navigation away from register page
  await page.waitForURL((url) => !url.pathname.includes("/register"), {
    timeout: 10_000,
  });

  return { username, email, password };
}

/**
 * Signs in an existing user via the login page.
 */
async function loginUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 10_000,
  });
}

/**
 * Creates a guest session via the homepage "Play as Guest" button.
 */
async function playAsGuest(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Play as Guest" }).click();

  // Guest flow creates a user and redirects
  await page.waitForURL((url) => url.pathname !== "/", { timeout: 10_000 });
}

// Custom test fixture that exposes auth helpers
type AuthFixtures = {
  registerUser: (
    overrides?: { username?: string; email?: string; password?: string }
  ) => Promise<{ username: string; email: string; password: string }>;
  loginUser: (email: string, password: string) => Promise<void>;
  playAsGuest: () => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  registerUser: async ({ page }, use) => {
    await use((overrides) => registerUser(page, overrides));
  },
  loginUser: async ({ page }, use) => {
    await use((email, password) => loginUser(page, email, password));
  },
  playAsGuest: async ({ page }, use) => {
    await use(() => playAsGuest(page));
  },
});

export { expect };
