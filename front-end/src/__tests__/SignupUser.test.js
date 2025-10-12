import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import SignupUserForm from "../SignupUser.tsx";
import { MemoryRouter } from "react-router-dom";

test("chooses organizer sign up and completes it", async () => {
    const name = "PlaceholderINC";
    const email = "placeholder@gmail.com";
    const password = "placeholder123";

    render(
        <MemoryRouter initialEntries={["/signup?role=Organizer"]}>
            <SignupUserForm />
        </MemoryRouter>
    );

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
});

test("chooses volunteer sign up and completes it", async () => {
    const name = "UserMcUserson";
    const email = "placeholder@gmail.com";
    const password = "placeholder123";

    render(
        <MemoryRouter initialEntries={["/signup?role=Volunteer"]}>
            <SignupUserForm />
        </MemoryRouter>
    );

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
});