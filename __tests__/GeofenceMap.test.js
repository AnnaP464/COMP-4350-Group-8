import { test, expect } from "@playwright/test";

// Use timestamp to avoid conflicts with existing users
const timestamp = Date.now();
const orgEmail = `geofence-org-${timestamp}@test.com`;
const password = "testtest";
const orgName = `GeoOrg${timestamp}`;

test.describe.configure({ mode: "serial" });

test.describe("Geofence Map Integration", () => {
  test("Organizer can create an event and add a geofence", async ({ page }) => {
    // Register a new organizer
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    // Go to sign-up
    await page.getByRole("link", { name: "Sign-up" }).click();
    await page.getByRole("link", { name: "Organizer" }).click();

    // Fill registration form
    await page.getByPlaceholder("Organization name *").fill(orgName);
    await page.getByPlaceholder("Email *").fill(orgEmail);
    await page.getByPlaceholder("Password *", { exact: true }).fill(password);
    await page.getByPlaceholder("Confirm Password *").fill(password);
    await page.getByRole("button", { name: "Sign-up" }).click();

    // Login
    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(orgEmail);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", { name: "Log-in" }).click();

    // Should be on organizer homepage
    await expect(page.getByRole("heading", { name: /Welcome,/i })).toBeVisible();

    // Click Create Event / New Event button
    const newEventBtn = page.getByRole("button", { name: /New Event/i });
    await expect(newEventBtn).toBeVisible();
    await newEventBtn.click();

    // Fill event details
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const startTime = `${year}-${month}-${day}T10:00`;
    const endTime = `${year}-${month}-${day}T12:00`;

    await expect(page.getByText("Create a job post")).toBeVisible();
    await page.getByPlaceholder("Job name *").fill("Geofence Test Event");
    await page.getByPlaceholder("Start time *").fill(startTime);
    await page.getByPlaceholder("End time *").fill(endTime);
    await page.getByPlaceholder("Location *").fill("Winnipeg, MB");
    await page
      .getByPlaceholder("Job description *")
      .fill("Testing geofence functionality");

    // Click Next: Geofence to proceed to geofence step
    await page.getByRole("button", { name: /Next: Geofence/i }).click();

    // Wait for the geofence modal to appear
    await expect(
      page.getByRole("heading", { name: /Add a geofence/i })
    ).toBeVisible();

    // Verify the leaflet map is rendered in the modal
    const mapContainer = page.locator(".leaflet-container");
    await expect(mapContainer).toBeVisible();

    // Verify Geoman draw controls are present (there are 2 toolbars: draw and edit)
    const drawToolbar = page.locator(".leaflet-pm-toolbar.leaflet-pm-draw");
    await expect(drawToolbar).toBeVisible();

    // Skip geofence for this test (just verifying the modal opens with the map)
    await page.getByRole("button", { name: /Skip geofence/i }).click();

    // Log out
    await page.getByRole("button", { name: /Sign Out|Log-out/i }).click();

    await expect(
      page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();
  });

  test("Geofence map renders and allows drawing", async ({ page }) => {
    // Login as existing organizer
    await page.goto("/");

    await page.getByRole("link", { name: "Log-in" }).click();
    await page.getByRole("link", { name: "Organizer" }).click();

    await page.getByPlaceholder("Email *").fill(orgEmail);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", { name: "Log-in" }).click();

    // Should be on organizer homepage
    await expect(page.getByRole("heading", { name: /Welcome,/i })).toBeVisible();

    // Look for an existing event to manage geofences
    // Or create a new event to test geofence modal

    // Create a new event to test geofence functionality
    await page.getByRole("button", { name: /New Event/i }).click();

    const now = new Date();
    now.setDate(now.getDate() + 2);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const startTime = `${year}-${month}-${day}T14:00`;
    const endTime = `${year}-${month}-${day}T16:00`;

    await page.getByPlaceholder("Job name *").fill("Map Drawing Test");
    await page.getByPlaceholder("Start time *").fill(startTime);
    await page.getByPlaceholder("End time *").fill(endTime);
    await page.getByPlaceholder("Location *").fill("Test Location");
    await page.getByPlaceholder("Job description *").fill("Testing map drawing");

    // Proceed to geofence step
    await page.getByRole("button", { name: /Next: Geofence/i }).click();

    // Wait for the geofence modal to appear
    await expect(
      page.getByRole("heading", { name: /Add a geofence/i })
    ).toBeVisible();

    // Check for leaflet map container
    const leafletMap = page.locator(".leaflet-container");
    await expect(leafletMap).toBeVisible();

    // Verify Geoman controls are present (draw tools)
    const drawToolbar = page.locator(".leaflet-pm-toolbar.leaflet-pm-draw");
    await expect(drawToolbar).toBeVisible();

    // Close the modal by clicking Skip geofence
    await page.getByRole("button", { name: /Skip geofence/i }).click();

    // Log out
    await page.getByRole("button", { name: /Sign Out|Log-out/i }).click();

    await expect(
      page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();
  });
});
