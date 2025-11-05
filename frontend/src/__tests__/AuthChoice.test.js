import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import AuthChoice from "../AuthChoice.tsx";
import { MemoryRouter } from "react-router-dom";

test("chooses organizer sign-in and completes it", async () => {
  render(
    <MemoryRouter initialEntries={[{ state: { role: "Organizer" } }]}>
      <AuthChoice />
    </MemoryRouter>
  );

  expect(screen.queryByText("Organizer Portal"));

  const volunteerButton = screen.getByRole("link", { name: "Sign-up" });
  await userEvent.click(volunteerButton);
  expect(screen.queryByText("Organizer Log-in"));
});

test("chooses organizer log in and completes it", async () => {
  render(
    <MemoryRouter initialEntries={[{ state: { role: "Organizer" } }]}>
      <AuthChoice />
    </MemoryRouter>
  );

  expect(screen.queryByText("Organizer Portal"));

  const volunteerButton = screen.getByRole("link", { name: "Log-in" });
  await userEvent.click(volunteerButton);
  expect(screen.queryByText("Organizer Log-in"));
});

test("chooses volunteer sign-in and completes it", async () => {
  render(
    <MemoryRouter initialEntries={[{ state: { role: "Volunteer" } }]}>
      <AuthChoice />
    </MemoryRouter>
  );

  expect(screen.queryByText("Volunteer Portal"));

  const volunteerButton = screen.getByRole("link", { name: "Sign-up" });
  await userEvent.click(volunteerButton);
  expect(screen.queryByText("Volunteer Log-in"));
});

test("chooses volunteer log in and completes it", async () => {
  render(
    <MemoryRouter initialEntries={[{ state: { role: "Volunteer" } }]}>
      <AuthChoice />
    </MemoryRouter>
  );

  expect(screen.queryByText("Volunteer Portal"));

  const volunteerButton = screen.getByRole("link", { name: "Log-in" });
  await userEvent.click(volunteerButton);
  expect(screen.queryByText("Volunteer Log-in"));
});