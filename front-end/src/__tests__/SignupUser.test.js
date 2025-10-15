import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import SignupUserForm from "../SignupUser.tsx";
import { MemoryRouter } from "react-router-dom";

test("chooses organizer sign up and completes it", async () => {
    const name = "PlaceholderINC";
    const email = "placeholder@gmail.com";
    const password = "placeholder123";

    //makes sure to modify the url with the organizer role
    render(
        <MemoryRouter initialEntries={["/signup?role=Organizer"]}>
            <SignupUserForm />
        </MemoryRouter>
    );
    
    //on the page fills in the information
    const nameField = screen.getByPlaceholderText("Organization name *");
    await userEvent.type(nameField, name);
    expect(nameField).toHaveValue(name);

    const emailField = screen.getByPlaceholderText("Email *");
    await userEvent.type(emailField, email);
    expect(emailField).toHaveValue(email);

    const passwordField = screen.getByPlaceholderText("Password *");
    await userEvent.type(passwordField, password);
    expect(passwordField).toHaveValue(password);

    const confirmPasswordField = screen.getByPlaceholderText("Confirm Password *");
    await userEvent.type(confirmPasswordField, password);
    expect(confirmPasswordField).toHaveValue(password);

    //submits it, should be redirected to log in 
    const button = screen.getByRole("button", { name: "Sign-up" });
    await userEvent.click(button);
    expect(screen.queryByText("Organizer Log-in"));
});

test("chooses volunteer sign up and completes it", async () => {
    const name = "UserMcUserson";
    const email = "placeholder@gmail.com";
    const password = "placeholder123";

    //makes sure to modify the url with the volunteer role
    render(
        <MemoryRouter initialEntries={["/signup?role=Volunteer"]}>
            <SignupUserForm />
        </MemoryRouter>
    );

    //on the page fills in the information
    const nameField = screen.getByPlaceholderText("Your username *");
    await userEvent.type(nameField, name);
    expect(nameField).toHaveValue(name);

    const emailField = screen.getByPlaceholderText("Email *");
    await userEvent.type(emailField, email);
    expect(emailField).toHaveValue(email);

    const passwordField = screen.getByPlaceholderText("Password *");
    await userEvent.type(passwordField, password);
    expect(passwordField).toHaveValue(password);

    const confirmPasswordField = screen.getByPlaceholderText("Confirm Password *");
    await userEvent.type(confirmPasswordField, password);
    expect(confirmPasswordField).toHaveValue(password);

    //submits it, should be redirected to log in 
    const button = screen.getByRole("button", { name: "Sign-up" });
    await userEvent.click(button);
    expect(screen.queryByText("Volunteer Log-in"));
});