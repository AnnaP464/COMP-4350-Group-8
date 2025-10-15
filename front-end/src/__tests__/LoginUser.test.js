import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import LoginUserForm from "../LoginUser.tsx";
import { MemoryRouter } from "react-router-dom";

test("chooses organizer log-in and completes it", async () => {
    const email = "placeholder@gmail.com";
    const password = "placeholder123";

    render(
        <MemoryRouter initialEntries={["/signup?role=Organizer"]}>
            <LoginUserForm />
        </MemoryRouter>
    );

    //fills in the login info
    const emailField = screen.getByPlaceholderText("Email *");
    await userEvent.type(emailField, email);
    expect(emailField).toHaveValue(email);

    const passwordField = screen.getByPlaceholderText("Password *");
    await userEvent.type(passwordField, password);
    expect(passwordField).toHaveValue(password);

    //should take it to the Homepage for Organizers
    const button = screen.getByRole("button", { name: "Log-in" });
    await userEvent.click(button);
    expect(screen.queryByText("Homepage"));
});

test("chooses volunteer log-in and completes it", async () => {
    const email = "placeholder@gmail.com";
    const password = "placeholder123";

    render(
        <MemoryRouter initialEntries={["/signup?role=Volunteer"]}>
            <LoginUserForm />
        </MemoryRouter>
    );

    //fills in the login info
    const emailField = screen.getByPlaceholderText("Email *");
    await userEvent.type(emailField, email);
    expect(emailField).toHaveValue(email);

    const passwordField = screen.getByPlaceholderText("Password *");
    await userEvent.type(passwordField, password);
    expect(passwordField).toHaveValue(password);

    //should take it to the dashboard
    const button = screen.getByRole("button", { name: "Log-in" });
    await userEvent.click(button);
    expect(screen.queryByText("Welcome to the Dashboard"));
});