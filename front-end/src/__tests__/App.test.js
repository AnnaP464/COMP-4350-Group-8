import React from "react"
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

test("renders login page by default", () => {
  render(<App />);
  expect(screen.getByText("Welcome to HiveHand")).toBeInTheDocument();
});

test("navigates to organizer signup page", async () => {
  render(<App />);

  const organizerButton = screen.getByRole("button", { name: "Organizer"});
  await userEvent.click(organizerButton);

  const signUpLink = screen.getByRole("link", { name: "Sign-up"});
  await userEvent.click(signUpLink);

  expect(screen.getByPlaceholderText("Organization name *")).toBeInTheDocument();
});