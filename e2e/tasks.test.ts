import { expect, test } from "@playwright/test";

test.describe("tasks", async () => {
	test("should load", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByRole("heading", { name: "ouroboard" })).toBeVisible();
	});
});
