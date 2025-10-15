import { test, expect } from "@playwright/test";
import { execSync } from 'child_process';

test("New organizer registration, login make an event and check profile", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "Organizer" })).toBeVisible();
    await page.getByRole("button", {name: "Organizer"}).click();
    await expect(page.getByText("Organizer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill("test0@test.com");
    await page.getByPlaceholder("Password *").fill("testtest");
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await expect(page.getByRole("link", { name: "Back to Role Selection" })).toBeVisible();
    await page.getByRole("link", {name: "Back to Role Selection"}).click();

    await expect(page.getByRole("button", { name: "Organizer" })).toBeVisible();
    await page.getByRole("button", {name: "Organizer"}).click();
    await expect(page.getByText("Organizer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("link", {name: "Sign-up"}).click();
    await expect(page.getByText("Organizer Sign-up")).toBeVisible();

    await page.getByPlaceholder("Organization name *").fill("testInc");
    await page.getByPlaceholder("Email *").fill("test0@test.com");
    await page.getByPlaceholder("Password *", {exact : true}).fill("testtest");
    await page.getByPlaceholder("Confirm Password *").fill("testtest");

    await expect(page.getByRole("button", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("button", {name: "Sign-up"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill("test0@test.com");
    await page.getByPlaceholder("Password *").fill("testtest");
    await page.getByRole("button", {name: "Log-in"}).click();

    await expect(page.getByText("HiveHand - testInc")).toBeVisible();

    await expect(page.getByRole("button", { name: "Create Event" })).toBeVisible();
    await page.getByRole("button", {name: "Create Event"}).click();
    await expect(page.getByText("Create a job post")).toBeVisible();
    await page.getByPlaceholder("Job name *").fill("jobjobjob");
    await page.getByPlaceholder("Minimum time commitment").fill("99");
    await page.getByPlaceholder("Location *").fill("atlanta");
    await page.getByPlaceholder("Job description *").fill("not good pay not fun, but you get experience");
    await expect(page.getByRole("button", { name: "Post Job" })).toBeVisible();
    await page.getByRole("button", {name: "Post Job"}).click();

    await expect(page.getByRole("button", { name: "Profile" })).toBeVisible();
    await page.getByRole("button", {name: "Profile"}).click();
    await expect(page.getByRole("button", { name: "Profile" })).toBeVisible();
    await page.getByRole("button", {name: "Profile"}).click();

    try {
        execSync(
        'psql -U hivedev -d hivehand -c "DELETE FROM users WHERE email = \'test0@test.com\';"',
        {
            stdio: 'inherit',
            env: {
            ...process.env,
            PGPASSWORD: 'verysafe',
            },
        }
        );
    } catch (err) {
        console.error('Cleanup failed:', err);
    }

});

test("New volunteer registration, login, try to sign up for an even and log out", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "Volunteer" })).toBeVisible();
    await page.getByRole("button", {name: "Volunteer"}).click();
    await expect(page.getByText("Volunteer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill("test0@test.com");
    await page.getByPlaceholder("Password *").fill("testtest");
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await expect(page.getByRole("link", { name: "Back to Role Selection" })).toBeVisible();
    await page.getByRole("link", {name: "Back to Role Selection"}).click();

    await expect(page.getByRole("button", { name: "Volunteer" })).toBeVisible();
    await page.getByRole("button", {name: "Volunteer"}).click();
    await expect(page.getByText("Volunteer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("link", {name: "Sign-up"}).click();
    await expect(page.getByText("Volunteer Sign-up")).toBeVisible();

    await page.getByPlaceholder("Your username *").fill("testGuy");
    await page.getByPlaceholder("Email *").fill("test1@test.com");
    await page.getByPlaceholder("Password *", {exact : true}).fill("testtest");
    await page.getByPlaceholder("Confirm Password *").fill("testtest");

    await expect(page.getByRole("button", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("button", {name: "Sign-up"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill("test1@test.com");
    await page.getByPlaceholder("Password *").fill("testtest");
    await page.getByRole("button", {name: "Log-in"}).click();

    await expect(page.getByText("Welcome to your Dashboard 🎉")).toBeVisible();

    const buttons = page.getByRole('button', { name: "Sign-up" });
    await expect(buttons).toHaveCount(3);
    await buttons.first().click();

    page.once("dialog", async dialog => {
        expect(dialog.type()).toBe("alert");
        expect(dialog.message()).toContain("Not quite finished yet, check back soon!");
        await dialog.accept();
    });

    await expect(page.getByRole("button", { name: "Log-out" })).toBeVisible();
    await page.getByRole("button", {name: "Log-out"}).click();

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    try {
        execSync(
        'psql -U hivedev -d hivehand -c "DELETE FROM users WHERE email = \'test1@test.com\';"',
        {
            stdio: 'inherit',
            env: {
            ...process.env,
            PGPASSWORD: 'verysafe',
            },
        }
        );
    } catch (err) {
        console.error('Cleanup failed:', err);
    }
});