import { test, expect } from "@playwright/test";

// Use timestamp to avoid conflicts with existing users
const timestamp = Date.now();
const email1 = `test-org-${timestamp}@test.com`;
const email2 = `test-vol-${timestamp}@test.com`;
const password = "testtest";
const orgName = `TestOrg${timestamp}`;
const userName = `TestUser${timestamp}`;

test.describe.configure({ mode: "serial" });

test("New organizer registration, login make an event and check profile", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();
    await expect(page.getByText("Organizer")).toBeVisible();

    await expect(page.getByRole("link", { name: "Organizer" })).toBeVisible();
    await page.getByRole("link", {name: "Organizer"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email1);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("Invalid credentials")).toBeVisible();

    await expect(page.getByRole("link", { name: "Back to Role Selection" })).toBeVisible();
    await page.getByRole("link", {name: "Back to Role Selection"}).click();

    await expect(page.getByRole("link", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("link", {name: "Sign-up"}).click();
    await expect(page.getByText("Organizer")).toBeVisible();

    await expect(page.getByRole("link", { name: "Organizer" })).toBeVisible();
    await page.getByRole("link", {name: "Organizer"}).click();
    await expect(page.getByText("Organizer Sign-up")).toBeVisible();

    await page.getByPlaceholder("Organization name *").fill(orgName);
    await page.getByPlaceholder("Email *").fill(email1);
    await page.getByPlaceholder("Password *", {exact : true}).fill(password);
    await page.getByPlaceholder("Confirm Password *").fill(password);

    await expect(page.getByRole("button", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("button", {name: "Sign-up"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email1);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();

    await expect(page.getByRole("heading", { name: /Welcome,/i })).toBeVisible();

    await expect(page.getByRole("button", { name: /New Event/i })).toBeVisible();
    await page.getByRole("button", {name: /New Event/i}).click();

    const now = new Date();
    now.setDate(now.getDate() + 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    await expect(page.getByText("Create a job post")).toBeVisible();
    await page.getByPlaceholder("Job name *").fill("jobjobjob");
    await page.getByPlaceholder("Start time *").fill(startTime);
    await page.getByPlaceholder("End time *").fill(endTime);
    await page.getByPlaceholder("Location *").fill("atlanta");
    await page.getByPlaceholder("Job description *").fill("not good pay not fun, but you get experience");
    await expect(page.getByRole("button", { name: /Next: Geofence/i })).toBeVisible();
    await page.getByRole("button", {name: /Next: Geofence/i}).click();

    // Wait for geofence modal to appear and skip it
    await expect(page.getByRole("heading", { name: /Add a geofence/i })).toBeVisible();
    await page.getByRole("button", { name: /Skip geofence/i }).click();

    await expect(page.getByRole("button", { name: /Sign Out/i })).toBeVisible();
    await page.getByRole("button", {name: /Sign Out/i}).click();

    await expect(
      page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();
});

test("New volunteer registration, login, try to sign up for an event and log out", async ({ page }) => {
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
    await page.getByPlaceholder("Email *").fill(email2);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("Invalid credentials")).toBeVisible();

    await expect(page.getByRole("link", { name: "Back to Role Selection" })).toBeVisible();
    await page.getByRole("link", {name: "Back to Role Selection"}).click();

    await expect(page.getByRole("link", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("link", {name: "Sign-up"}).click();
    await expect(page.getByText("Volunteer")).toBeVisible();

    await expect(page.getByRole("link", { name: "Volunteer" })).toBeVisible();
    await page.getByRole("link", {name: "Volunteer"}).click();
    await expect(page.getByText("Volunteer Sign-up")).toBeVisible();

    await page.getByPlaceholder("Your username *").fill(userName);
    await page.getByPlaceholder("Email *").fill(email2);
    await page.getByPlaceholder("Password *", {exact : true}).fill(password);
    await page.getByPlaceholder("Confirm Password *").fill(password);

    await expect(page.getByRole("button", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("button", {name: "Sign-up"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email2);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    
    await expect(page.getByText("Dashboard")).toBeVisible();

    const buttons = page.getByRole('button', { name: "Apply" });
    await expect(buttons.first()).toBeVisible();

    await expect(page.getByRole("button", { name: "Log-out" })).toBeVisible();
    await page.getByRole("button", {name: "Log-out"}).click();

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();
});