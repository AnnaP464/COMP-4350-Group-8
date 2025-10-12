import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import LoginUserForm from "../LoginUser.tsx";
import { MemoryRouter } from "react-router-dom";

test("chooses organizer sign up and completes it", async () => {
    const email = "placeholder@gmail.com";
    const password = "placeholder123";

    render(
        <MemoryRouter initialEntries={["/signup?role=Organizer"]}>
            <LoginUserForm />
        </MemoryRouter>
    );
    const emailField = screen.getByPlaceholderText("Email *");
    await userEvent.type(emailField, email);
    expect(emailField).toHaveValue(email);

    const passwordField = screen.getByPlaceholderText("Password *");
    await userEvent.type(passwordField, password);
    expect(passwordField).toHaveValue(password);
});

test("chooses volunteer sign up and completes it", async () => {
    const email = "placeholder@gmail.com";
    const password = "placeholder123";

    render(
        <MemoryRouter initialEntries={["/signup?role=Volunteer"]}>
            <LoginUserForm />
        </MemoryRouter>
    );

    const emailField = screen.getByPlaceholderText("Email *");
    await userEvent.type(emailField, email);
    expect(emailField).toHaveValue(email);

    const passwordField = screen.getByPlaceholderText("Password *");
    await userEvent.type(passwordField, password);
    expect(passwordField).toHaveValue(password);
});