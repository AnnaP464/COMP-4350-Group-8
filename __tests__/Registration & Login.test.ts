import { test, expect } from "@playwright/test";
import { execSync } from 'child_process';

const email = "test3@test.com"
const password = "testtest"
const orgName = "testInc"

test.beforeAll(async () => {
    //deletes user to make sure test will go well
    deleteUserData(email);
});

test.afterAll( async () => {
    //deletes user for future tests
    deleteUserData(email);
});

test("Tests that the registration and login features work for a new user", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    //first checks that the user doesnt yet exist
    await expect(page.getByRole("button", { name: "Organizer" })).toBeVisible();
    await page.getByRole("button", {name: "Organizer"}).click();
    await expect(page.getByText("Organizer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    //registers new user
    await expect(page.getByRole("button", { name: "Organizer" })).toBeVisible();
    await page.getByRole("button", {name: "Organizer"}).click();
    await expect(page.getByText("Organizer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("link", {name: "Sign-up"}).click();
    await expect(page.getByText("Organizer Sign-up")).toBeVisible();

    await page.getByPlaceholder("Organization name *").fill(orgName);
    await page.getByPlaceholder("Email *").fill(email);
    await page.getByPlaceholder("Password *", {exact : true}).fill(password);
    await page.getByPlaceholder("Confirm Password *").fill(password);

    await expect(page.getByRole("button", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("button", {name: "Sign-up"}).click();

    //logs in as new user
    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();

    await expect(page.getByText("HiveHand - testInc")).toBeVisible();
});

test("Checks for user persistance on page reload to show user is not stored in browser", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    await page.reload();

     //registers new user
    await expect(page.getByRole("button", { name: "Organizer" })).toBeVisible();
    await page.getByRole("button", {name: "Organizer"}).click();
    await expect(page.getByText("Organizer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("HiveHand - testInc")).toBeVisible();
});

function deleteUserData(email: String){
    try {
        execSync(
        `psql -U hivedev -d hivehand -c "DELETE FROM users WHERE email = ${email}/";`,
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
}
