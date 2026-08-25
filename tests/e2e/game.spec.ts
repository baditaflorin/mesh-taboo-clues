import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

test("room peers derive the same live prompt", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: "mesh-taboo-clues",
  });

  try {
    await expect(a.locator(".clue-card h2")).toBeVisible();
    await expect(b.locator(".clue-card h2")).toBeVisible();
    await expect(a.locator(".clue-card h2")).toHaveText(
      await b.locator(".clue-card h2").innerText(),
    );
    await a.getByRole("button", { name: /start shared round/i }).click();
    await expect(b.getByRole("button", { name: /restart round/i })).toBeVisible();
    await expect(a.getByText(/players here/i)).toBeVisible();
    await expect(b.getByText(/players here/i)).toBeVisible();
  } finally {
    await cleanup();
  }
});
