import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

//test the routes the app can redirect to from the role selection screen
test("renders login page by default", () => {
  render(<App />);
  expect(screen.getByText("Welcome to HiveHand")).toBeInTheDocument();
});

//test the organizer screen
test("navigates to organizer auth selection page", async () => {
  render(<App />);

  const organizerButton = screen.getByRole("link", { name: "Organizer"});
  await userEvent.click(organizerButton);
  expect(screen.getByText("Organizer Portal")).toBeInTheDocument();

  const logInButton = screen.getByRole("link", { name: "Log-in"});
  await userEvent.click(logInButton);
  expect(screen.getByText("Organizer Log-in")).toBeInTheDocument();

  const backButton = screen.getByRole("link", { name: "Back to Role Selection"});
  await userEvent.click(backButton);
  expect(screen.getByText("Welcome to HiveHand")).toBeInTheDocument();
});

//test the volunteer screen
test("navigates to volunteer auth selection page", async () => {
  render(<App />);

  const organizerButton = screen.getByRole("link", { name: "Volunteer"});
  await userEvent.click(organizerButton);
  expect(screen.getByText("Volunteer Portal")).toBeInTheDocument();

  const logInButton = screen.getByRole("link", { name: "Log-in"});
  await userEvent.click(logInButton);
  expect(screen.getByText("Volunteer Log-in")).toBeInTheDocument();

  const backButton = screen.getByRole("link", { name: "Back to Role Selection"});
  await userEvent.click(backButton);
  expect(screen.getByText("Welcome to HiveHand")).toBeInTheDocument();
});