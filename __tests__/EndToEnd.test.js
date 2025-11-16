import { test, expect } from "@playwright/test";
import { execSync } from 'child_process';

//tests use diffirent useremails to prevent erasing eachother's data mid test
const email1 = "test0@test.com"
const email2 = "test1@test.com"
const password = "testtest"
const orgName = "testInc"
const userName = "testGuy"

test.describe.configure({ mode: "serial" });

// test.beforeAll(async () => {
//     //deletes user to make sure test will go well
//     deleteUserData(email1);
//     deleteUserData(email2);
// });

// test.afterAll(async () => {
//     //deletes user to make sure database is unaffected
//     deleteUserData(email1);
//     deleteUserData(email2);
// });

test("New organizer registration, login make an event and check profile", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Organizer" })).toBeVisible();
    await page.getByRole("link", {name: "Organizer"}).click();
    await expect(page.getByText("Organizer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email1);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await expect(page.getByRole("link", { name: "Back to Role Selection" })).toBeVisible();
    await page.getByRole("link", {name: "Back to Role Selection"}).click();

    await expect(page.getByRole("link", { name: "Organizer" })).toBeVisible();
    await page.getByRole("link", {name: "Organizer"}).click();
    await expect(page.getByText("Organizer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("link", {name: "Sign-up"}).click();
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

    await expect(page.getByText("HiveHand - testInc")).toBeVisible();

    await expect(page.getByRole("button", { name: "Create Event" })).toBeVisible();
    await page.getByRole("button", {name: "Create Event"}).click();
    await expect(page.getByText("Create a job post")).toBeVisible();
    await page.getByPlaceholder("Job name *").fill("jobjobjob");
    await page.getByPlaceholder("Start time *").fill("2025-10-23T01:00");
    await page.getByPlaceholder("End time *").fill("2025-10-23T02:00");
    await page.getByPlaceholder("Location *").fill("atlanta");
    await page.getByPlaceholder("Job description *").fill("not good pay not fun, but you get experience");
    await expect(page.getByRole("button", { name: "Post Job" })).toBeVisible();
    await page.getByRole("button", {name: "Post Job"}).click();

    await expect(page.getByRole("button", { name: "Profile" })).toBeVisible();
    await page.getByRole("button", {name: "Profile"}).click();
    await expect(page.getByRole("button", { name: "Profile" })).toBeVisible();
    await page.getByRole("button", {name: "Profile"}).click();
});

test("New volunteer registration, login, try to sign up for an event and log out", async ({ page }) => {
    //goes to the default role selection page
    await page.goto("/"); 

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Volunteer" })).toBeVisible();
    await page.getByRole("link", {name: "Volunteer"}).click();
    await expect(page.getByText("Volunteer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Log-in" })).toBeVisible();
    await page.getByRole("link", {name: "Log-in"}).click();

    await expect(page.getByRole("button", { name: "Log-in" })).toBeVisible();
    await page.getByPlaceholder("Email *").fill(email2);
    await page.getByPlaceholder("Password *").fill(password);
    await page.getByRole("button", {name: "Log-in"}).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await expect(page.getByRole("link", { name: "Back to Role Selection" })).toBeVisible();
    await page.getByRole("link", {name: "Back to Role Selection"}).click();

    await expect(page.getByRole("link", { name: "Volunteer" })).toBeVisible();
    await page.getByRole("link", {name: "Volunteer"}).click();
    await expect(page.getByText("Volunteer Portal")).toBeVisible();

    await expect(page.getByRole("link", { name: "Sign-up" })).toBeVisible();
    await page.getByRole("link", {name: "Sign-up"}).click();
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
    
    await expect(page.getByText("Welcome to your Dashboard")).toBeVisible();

    const buttons = page.getByRole('button', { name: "Sign-up" });
    await expect(buttons.first()).toBeVisible();

    await expect(page.getByRole("button", { name: "Log-out" })).toBeVisible();
    await page.getByRole("button", {name: "Log-out"}).click();

    await expect(
        page.getByRole("heading", { level: 2, name: /welcome to hivehand/i })
    ).toBeVisible();
});

// //deletes the user with the email address from the database
// function deleteUserData(email){
//     try {
//         execSync(
//         `psql -U hivedev -d hivehand -c "DELETE FROM users WHERE email = '${email}'";`,
//         {
//             stdio: 'inherit',
//             env: {
//             ...process.env,
//             PGPASSWORD: 'verysafe',
//             },
//         }
//         );
//     } catch (err) {
//         console.error('Cleanup failed:', err);
//     }
// }