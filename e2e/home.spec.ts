import { test, expect } from "./fixtures";

test.describe("Homepage", () => {
  test("shows game title and tagline", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Alpha-bet-y")).toBeVisible();
    await expect(
      page.getByText("The competitive word bidding game")
    ).toBeVisible();
  });

  test("shows guest play and sign-in buttons when logged out", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "Play as Guest" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sign In" })
    ).toBeVisible();
  });

  test("shows Play Now button when authenticated", async ({
    page,
    registerUser,
  }) => {
    await registerUser();
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Play Now" })
    ).toBeVisible();

    // Guest/sign-in buttons should not be visible
    await expect(
      page.getByRole("button", { name: "Play as Guest" })
    ).not.toBeVisible();
  });

  test("sign in link navigates to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("has navigation bar", async ({ page }) => {
    await page.goto("/");

    // Navbar should be present
    await expect(page.locator("nav")).toBeVisible();
  });
});
