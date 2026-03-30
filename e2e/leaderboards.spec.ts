import { test, expect } from "./fixtures";

test.describe("Leaderboards", () => {
  test("renders leaderboard page with tabs", async ({ page }) => {
    await page.goto("/leaderboards");

    await expect(page.getByText("Leaderboards")).toBeVisible();

    // All three tabs should be present
    await expect(page.getByRole("button", { name: "Rating" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Streaks" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Friends" })).toBeVisible();
  });

  test("defaults to global rating tab", async ({ page }) => {
    await page.goto("/leaderboards");

    // Rating tab should have the active style (bg-game-accent)
    const ratingBtn = page.getByRole("button", { name: "Rating" });
    await expect(ratingBtn).toHaveClass(/bg-game-accent/);
  });

  test("switches to streak tab", async ({ page }) => {
    await page.goto("/leaderboards");

    await page.getByRole("button", { name: "Streaks" }).click();

    const streakBtn = page.getByRole("button", { name: "Streaks" });
    await expect(streakBtn).toHaveClass(/bg-game-accent/);
  });

  test("friends tab shows sign-in prompt for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/leaderboards");

    await page.getByRole("button", { name: "Friends" }).click();

    await expect(
      page.getByText("Sign in to see your friends leaderboard")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
  });

  test("friends tab loads for authenticated user", async ({
    page,
    registerUser,
  }) => {
    await registerUser();
    await page.goto("/leaderboards");

    await page.getByRole("button", { name: "Friends" }).click();

    // Should not show sign-in prompt
    await expect(
      page.getByText("Sign in to see your friends leaderboard")
    ).not.toBeVisible();

    // Should show either entries or "Follow other players" message
    const entriesOrEmpty = page
      .getByText("Follow other players to see them here!")
      .or(page.locator("[class*=bg-game-card]").first());
    await expect(entriesOrEmpty).toBeVisible({ timeout: 5_000 });
  });

  test("rating leaderboard shows empty state or entries", async ({ page }) => {
    await page.goto("/leaderboards");

    // Either we see entries or the empty state
    const content = page
      .getByText("No entries yet. Be the first to play!")
      .or(page.locator("[class*=bg-game-card]").first());
    await expect(content).toBeVisible({ timeout: 5_000 });
  });
});
