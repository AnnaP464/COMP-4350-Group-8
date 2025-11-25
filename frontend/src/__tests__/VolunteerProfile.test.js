import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import VolunteerProfile from "../VolunteerProfile";

// --- Mocks ---
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const setupLocalStorageMock = (store = {}) => {
  const ls = {
    getItem: jest.fn((k) => (k in store ? store[k] : null)),
    setItem: jest.fn((k, v) => {
      store[k] = v;
    }),
    removeItem: jest.fn((k) => {
      delete store[k];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
  };
  Object.defineProperty(window, "localStorage", { value: ls, writable: true });
  return ls;
};

const renderWithRoutes = (state = { role: "Volunteer" }) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/VolunteerProfile", state }]}>
      <Routes>
        <Route path="/User-login" element={<div>LOGIN PAGE</div>} />
        <Route path="/Dashboard" element={<div>DASHBOARD</div>} />
        <Route path="/VolunteerProfile" element={<VolunteerProfile />} />
      </Routes>
    </MemoryRouter>
  );

describe("VolunteerProfile", () => {
  let alertSpy;
  let fetchMock;
  let ls;

  beforeEach(() => {
    jest.resetAllMocks();
    ls = setupLocalStorageMock();
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("redirects to login if access_token is missing", async () => {
    ls.getItem.mockImplementation((k) => (k === "access_token" ? null : null));

    renderWithRoutes({ role: "Volunteer" });

    await waitFor(() => 
        expect(mockNavigate).toHaveBeenCalledWith("/User-login", { replace: true, state: {role: "Volunteer"} })
    );

    expect(alertSpy).toHaveBeenCalledWith("Please sign in first.");
  });

  test("loads profile successfully and saves a goal to localStorage", async () => {
    ls.getItem.mockImplementation((k) => {
      if (k === "access_token") return "abc";
      if (k === "hoursGoal") return null;
      return null;
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: "u1",
        username: "sudipta",
        role: "Volunteer",
        createdAt: "2025-01-01T00:00:00Z",
      }),
    });

    renderWithRoutes({ role: "Volunteer" });

    // Wait for username
    expect(await screen.findByText(/sudipta/i)).toBeInTheDocument();

    // Open goal dialog
    const setGoalBtn = screen.getByRole("button", { name: /set goal/i });
    fireEvent.click(setGoalBtn);

    const input = await screen.findByPlaceholderText("e.g., 100");
    fireEvent.change(input, { target: { value: "120" } });

    const saveBtn = screen.getByRole("button", { name: /save goal/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(ls.setItem).toHaveBeenCalledWith("hoursGoal", "120");
    });
  });

  test("handles fetch failure gracefully", async () => {
    ls.getItem.mockImplementation((k) => (k === "access_token" ? "abc" : null));

    // fetchMock.mockResolvedValueOnce({
    //   ok: false,
    //   status: 500,
    //   json: async () => ({}),
    // });

    fetchMock.mockRejectedValueOnce(new Error("Network error"));


    renderWithRoutes({ role: "Volunteer" });

    await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Failed to load profile.");
        expect(mockNavigate).toHaveBeenCalledWith("/Dashboard", {replace: true, state: {role: "Volunteer"} });
    });
  });
});
