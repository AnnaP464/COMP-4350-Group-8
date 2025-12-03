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

// Mock UserService
const mockAuthMe = jest.fn();
const mockFetchVolunteerStats = jest.fn();
jest.mock("../services/UserService", () => ({
  __esModule: true,
  authMe: (...args) => mockAuthMe(...args),
  fetchVolunteerStats: (...args) => mockFetchVolunteerStats(...args),
}));

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
  let ls;

  beforeEach(() => {
    jest.resetAllMocks();
    ls = setupLocalStorageMock({
      access_token: "test-token",
      hoursGoal: null,
    });
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("redirects to login if auth check fails", async () => {
    // Mock authMe to return non-ok (unauthorized)
    mockAuthMe.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    mockFetchVolunteerStats.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ totalMinutes: 0, totalHours: 0, jobsCompleted: 0, upcomingJobs: 0 }),
    });

    renderWithRoutes({ role: "Volunteer" });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/User-login", { replace: true, state: { role: "Volunteer" } })
    );
  });

  test("loads profile successfully and saves a goal to localStorage", async () => {
    // Mock authMe success
    mockAuthMe.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: "u1",
        username: "sudipta",
        role: "Volunteer",
        createdAt: "2025-01-01T00:00:00Z",
      }),
    });
    // Mock fetchVolunteerStats success
    mockFetchVolunteerStats.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        totalMinutes: 120,
        totalHours: 2,
        jobsCompleted: 5,
        upcomingJobs: 2,
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
    // Mock authMe to throw network error
    mockAuthMe.mockRejectedValueOnce(new Error("Network error"));

    renderWithRoutes({ role: "Volunteer" });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to load profile.");
      expect(mockNavigate).toHaveBeenCalledWith("/Dashboard", { replace: true, state: { role: "Volunteer" } });
    });
  });

  test("displays stats correctly after loading", async () => {
    mockAuthMe.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: "u1",
        username: "testuser",
        role: "Volunteer",
        createdAt: "2025-01-01T00:00:00Z",
      }),
    });
    mockFetchVolunteerStats.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        totalMinutes: 300,
        totalHours: 5,
        jobsCompleted: 10,
        upcomingJobs: 3,
      }),
    });

    renderWithRoutes({ role: "Volunteer" });

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    // Check stats are displayed
    expect(screen.getByText("5h")).toBeInTheDocument(); // Total Hours
    expect(screen.getByText("10")).toBeInTheDocument(); // Jobs Completed
    expect(screen.getByText("3")).toBeInTheDocument(); // Upcoming
  });
});
