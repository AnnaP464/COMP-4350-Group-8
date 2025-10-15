import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import Dashboard from "../Dashboard.tsx";
import { MemoryRouter } from "react-router-dom";


test("Tries to sign up for an event", async () => {
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    //Tries to bring up the menu of the sign up but its empty
    const buttons = screen.getAllByRole("button", { name: "Sign-up" });
    await userEvent.click(buttons[0]);
    expect(screen.queryByText("Welcome to your Dashboard 🎉"));
});

test("Will try to logout and go to the role selection screen", async () => {
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    //redirects the user to the role selection screen
    const button = screen.getByRole("button", { name: "Log-out" });
    await userEvent.click(button);
    expect(screen.queryByText("Welcome to HiveHand"));
});
