import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import Dashboard from "../Dashboard.tsx";
import { MemoryRouter } from "react-router-dom";


test("Tries to sign up for an event, will fail", async () => {
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    const buttons = screen.getAllByRole("button", { name: "Sign-up" });
    await userEvent.click(buttons[0]);
    expect(screen.queryByText("Organizer Sign-up"));

});

test("Will try to logout and go to the title screen", async () => {
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    const button = screen.getByRole("button", { name: "Log-out" });
    await userEvent.click(button);
    expect(screen.queryByText("Welcome to HiveHand"));

});
