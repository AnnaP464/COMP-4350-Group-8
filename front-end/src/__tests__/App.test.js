import React from "react"
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

test("renders login page by default", () => {
  render(<App />);
  expect(screen.getByText("Welcome to HiveHand")).toBeInTheDocument();
});

test("navigates to organizer auth selection page", async () => {
  render(<App />);

  const organizerButton = screen.getByRole("button", { name: "Organizer"});
  await userEvent.click(organizerButton);
  expect(screen.getByText("Organizer Portal")).toBeInTheDocument();

  const backButton = screen.getByRole("button", { name: "Back to Role Selection"});
  await userEvent.click(backButton);
  expect(screen.getByText("Welcome to HiveHand")).toBeInTheDocument();
});

test("navigates to volunteer auth selection page", async () => {
  render(<App />);

  const organizerButton = screen.getByRole("button", { name: "Volunteer"});
  await userEvent.click(organizerButton);
  expect(screen.getByText("Volunteer Portal")).toBeInTheDocument();

  const backButton = screen.getByRole("button", { name: "Back to Role Selection"});
  await userEvent.click(backButton);
  expect(screen.getByText("Welcome to HiveHand")).toBeInTheDocument();
});

test("navigates to guest buffer page", async () => {
  render(<App />);

  const organizerButton = screen.getByRole("button", { name: "Continue as Guest"});
  await userEvent.click(organizerButton);
  expect(screen.getByText("Guest Portal")).toBeInTheDocument();

  const backButton = screen.getByRole("button", { name: "Back to Role Selection"});
  await userEvent.click(backButton);
  expect(screen.getByText("Welcome to HiveHand")).toBeInTheDocument();
});
