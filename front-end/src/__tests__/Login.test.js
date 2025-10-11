import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import LoginForm from "../Login.tsx";
import { MemoryRouter } from "react-router-dom";

test("chooses organizer sign up and completes it", async () => {
    render(
        <MemoryRouter>
            <LoginForm />
        </MemoryRouter>
    );

    const organizerButton = screen.getByRole("button", { name: "Organizer" });
    await userEvent.click(organizerButton);
    expect(screen.queryByText("Organizer portal"));

    const signUpButton = screen.getByRole("link", { name: "Sign-up" });
    await userEvent.click(signUpButton);
    expect(screen.queryByText("Organizer Sign-up"));

    const backButton = screen.getByRole("button", { name: "Back" });
    await userEvent.click(backButton);
    expect(screen.queryByText("Welcome to HiveHand"))
});

//THIS TEST DOESNT WORK BECAUSE THE FRONT END ISNT DONE
test("chooses organizer log in and completes it", async () => {
    render(
        <MemoryRouter>
            <LoginForm />
        </MemoryRouter>
    );

    const organizerButton = screen.getByRole("button", { name: "Organizer" });
    await userEvent.click(organizerButton);
    expect(screen.queryByText("Organizer portal"));

    const logInButton = screen.getByRole("link", { name: "Log-in" });
    await userEvent.click(logInButton);
    expect(screen.queryByText("Organizer Log-in"));

    const backButton = screen.getByRole("button", { name: "Back to Log-in" });
    await userEvent.click(backButton);
    expect(screen.queryByText("Welcome to HiveHand"))
});

//THIS TEST DOESNT WORK BECAUSE THE FRONT END ISNT DONE
test("chooses volunteer sign in and completes it", async () => {
    render(
        <MemoryRouter>
            <LoginForm />
        </MemoryRouter>
    );

    const volunteerButton = screen.getByRole("button", { name: "Volunteer" });
    await userEvent.click(volunteerButton);
    expect(screen.queryByText("Volunteer portal"));

    const signUpButton = screen.getByRole("link", { name: "Sign-up" });
    await userEvent.click(signUpButton);
    expect(screen.queryByText("Volunteer Sign-up"));

    const backButton = screen.getByRole("button", { name: "Back" });
    await userEvent.click(backButton);
    expect(screen.queryByText("Welcome to HiveHand"))
});

//THIS TEST DOESNT WORK BECAUSE THE FRONT END ISNT DONE
test("chooses volunteer log in and completes it", async () => {
    render(
        <MemoryRouter>
            <LoginForm />
        </MemoryRouter>
    );

    const volunteerButton = screen.getByRole("button", { name: "Volunteer" });
    await userEvent.click(volunteerButton);
    expect(screen.queryByText("Volunteer portal"));

    const LogInButton = screen.getByRole("link", { name: "Log-in" });
    await userEvent.click(LogInButton);
    expect(screen.queryByText("Volunteer Log-in"));

    const backButton = screen.getByRole("button", { name: "Back to Log-in" });
    await userEvent.click(backButton);
    expect(screen.queryByText("Welcome to HiveHand"))
});