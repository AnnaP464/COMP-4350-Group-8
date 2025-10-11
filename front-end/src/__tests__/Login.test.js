import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import LoginForm from "../Login.tsx";
import { MemoryRouter } from "react-router-dom";

test("chooses organizer log in and completes it", async () => {
    render(
        <MemoryRouter>
            <LoginForm />
        </MemoryRouter>
    );

    const organizerButton = screen.getByRole("button", { name: /organizer/i });
    await userEvent.click(organizerButton)

    expect(screen.queryByText(/Organizer portal/i))
});