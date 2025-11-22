import { test, expect } from "@playwright/test";

const email = "test3@test.com"
const password = "testtest"
const userName = "testInc2"

test.describe.configure({ mode: "serial" });

test("Tests that the registration and login features work for a new user", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();
    await expect(page.getByText("Volunteer")).toBeVisible();

    await expect(page.getByRole("link", { name: "Volunteer" })).toBeVisible();
    await page.getByRole("link", {name: "Volunteer"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await expect(page.getByRole("link", { name: "Back to Role Selection" })).toBeVisible();
    await page.getByRole("link", {name: "Back to Role Selection"}).click();

    await expect(page.getByRole("link", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("link", {name: "Sign-up"}).click();
    await expect(page.getByText("Volunteer")).toBeVisible();

    await expect(page.getByRole("link", { name: "Volunteer" })).toBeVisible();
    await page.getByRole("link", {name: "Volunteer"}).click();
    await expect(page.getByText("Volunteer Sign-up")).toBeVisible();

    await page.getByPlaceholder("Your username *").fill(userName);
    await page.getByPlaceholder("Email *").fill(email);
    await page.getByPlaceholder("Password *", {exact : true}).fill(password);
    await page.getByPlaceholder("Confirm Password *").fill(password);

    await expect(page.getByRole("button", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("button", {name: "Sign-up"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    
    await expect(page.getByText("Welcome to your Dashboard")).toBeVisible();
});

test("Checks for user persistance on page reload to show user is not stored in browser", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    await page.reload();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();
    await expect(page.getByText("Volunteer")).toBeVisible();

    await expect(page.getByRole("link", { name: "Volunteer" })).toBeVisible();
    await page.getByRole("link", {name: "Volunteer"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();

    await expect(page.getByText("Welcome to your Dashboard")).toBeVisible();

    await expect(page.getByRole("button", { name: "Log-out" })).toBeVisible();
    await page.getByRole("button", {name: "Log-out"}).click();
});