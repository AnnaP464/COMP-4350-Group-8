import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import SignupOrganizerForm from "../SignupOrganizer.tsx";
import { MemoryRouter } from "react-router-dom";

test("chooses organizer sign up and completes it", async () => {
    const orgName = "PlaceholderINC";
    const orgEmail = "placeholder@gmail.com";
    const orgPassword = "placeholder123";

    render(
        <MemoryRouter>
            <SignupOrganizerForm />
        </MemoryRouter>
    );

    const orgNameField = screen.getByPlaceholderText("Organization name *");
    await userEvent.type(orgNameField, orgName);
    expect(orgNameField).toHaveValue(orgName);

    const emailField = screen.getByPlaceholderText("Email *");
    await userEvent.type(emailField, orgEmail);
    expect(emailField).toHaveValue(orgEmail);

    const passwordField = screen.getByPlaceholderText("Password *");
    await userEvent.type(passwordField, orgPassword);
    expect(passwordField).toHaveValue(orgPassword);

    const confirmPasswordField = screen.getByPlaceholderText("Confirm Password *");
    await userEvent.type(confirmPasswordField, orgPassword);
    expect(confirmPasswordField).toHaveValue(orgPassword);
});