import React from "react";
import {render, screen, waitFor, fireEvent} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import Dashboard from "../Dashboard.tsx";
import { MemoryRouter } from "react-router-dom";

// --- Mocks ---
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useAuthGuard to always return "authorized" so component renders
jest.mock("../hooks/useAuthGuard", () => ({
  __esModule: true,
  default: jest.fn(() => "authorized"),
}));

// Mock EventService
const mockFetchAllEvents = jest.fn();
const mockFetchApplications = jest.fn();
const mockApplyToEvent = jest.fn();
jest.mock("../services/EventService", () => ({
  __esModule: true,
  fetchAllEvents: (...args) => mockFetchAllEvents(...args),
  fetchApplications: (...args) => mockFetchApplications(...args),
  applyToEvent: (...args) => mockApplyToEvent(...args),
}));

// Mock EventHelper to transform raw API events to display format
jest.mock("../helpers/EventHelper", () => ({
  cleanEvents: jest.fn((events) => events.map(e => ({
    id: e.id,
    jobName: e.jobName,
    location: e.location,
    description: e.description,
    // Transform ISO timestamps to display strings
    startDate: "Oct 23, 2099",
    endDate: "Oct 24, 2099",
    startTime: "8:00 AM",
    endTime: "9:00 AM",
    createdAtDate: "Oct 29, 2025",
    createdAtTime: "12:09 AM",
    startTimestamp: Date.now() + 86400000,
    endTimestamp: Date.now() + 90000000,
  }))),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // mock fetch for UserService.logout which uses raw fetch
  global.fetch = jest.fn();
  // mock alert
  jest.spyOn(window, "alert").mockImplementation(() => {});
  // mock console.error to avoid noisy logs (and to assert error path)
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  // mock localStorage with Object.defineProperty
  const store = {
    user: JSON.stringify({ username: "TestUser", role: "Volunteer" }),
    access_token: "test-token",
  };
  const localStorageMock = {
    getItem: jest.fn((k) => store[k] || null),
    setItem: jest.fn((k, v) => { store[k] = v; }),
    removeItem: jest.fn((k) => { delete store[k]; }),
    clear: jest.fn(() => { for (const k in store) delete store[k]; }),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Helper to set up default mocks for initial load
function mockInitialLoad(events = [], applications = []) {
  mockFetchAllEvents.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => events,
  });
  mockFetchApplications.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => applications,
  });
}

test("Tries to sign up for an event", async () => {
  const testEvents = [{
    id: "5e9d21a6-95b7-4b55-a8f7-9648bdf782cb",
    organizerId: "51d6573c-5d62-4b3d-9853-b09e6095e367",
    jobName: "Test Event",
    description: "Test description",
    startTime: "2099-10-23T01:00:00.000Z",
    endTime: "2099-10-24T02:00:00.000Z",
    location: "Test Location",
    createdAt: "2025-10-29T05:09:05.344Z"
  }];

  mockInitialLoad(testEvents);

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  // First verify API was called
  await waitFor(() => {
    expect(mockFetchAllEvents).toHaveBeenCalled();
  });

  // Wait for events to load
  await waitFor(() => {
    expect(screen.getByText(/Test Event/i)).toBeInTheDocument();
  }, { timeout: 3000 });

  // Find and click Apply button
  const applyButton = screen.getByRole("button", { name: /Apply/i });
  expect(applyButton).toBeInTheDocument();
});

test("Will try to logout and go to the role selection screen", async () => {
  mockInitialLoad();

  // Mock logout fetch call
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 204,
    text: async () => "",
  });

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  // Wait for component to render
  await waitFor(() => {
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  // Click logout button
  const button = screen.getByRole("button", { name: /Log-out/i });
  await userEvent.click(button);

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});

test("renders fetched events", async () => {
  const fetchedEvents = [{
    id: "8fcbb58b-7953-4a3b-a2a0-759f306b3d3f",
    organizerId: "51d6573c-5d62-4b3d-9853-b09e6095e367",
    jobName: "Replaced Event",
    description: "moon stuff",
    startTime: "2099-11-01T00:00:00.000Z",
    endTime: "2099-11-01T02:00:00.000Z",
    location: "moon",
    createdAt: "2025-10-29T05:35:34.446Z"
  }];

  mockInitialLoad(fetchedEvents);

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  // after fetch resolves, event should appear
  await waitFor(() => {
    expect(screen.getByText(/Replaced Event/i)).toBeInTheDocument();
  });
});

test("handles fetch failure path (logs an error)", async () => {
  mockFetchAllEvents.mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => ({}),
  });
  mockFetchApplications.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => [],
  });

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching events:",
      expect.any(Error)
    );
  });
});

test("logout success (204): clears localStorage and navigates home", async () => {
  mockInitialLoad();

  // Mock logout POST -> 204
  global.fetch.mockResolvedValueOnce({ ok: true, status: 204, text: async () => "" });

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /log-out/i }));

  await waitFor(() => {
    expect(localStorage.removeItem).toHaveBeenCalledWith("user");
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});

test("logout success but non-204: attempts to parse JSON (and still navigates)", async () => {
  mockInitialLoad();

  // Mock logout POST -> 200 with json that throws
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("bad json");
    },
  });

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /log-out/i }));

  await waitFor(() => {
    // inner catch logs "Unexpected JSON package"
    expect(console.error).toHaveBeenCalledWith(
      "Unexpected JSON package",
      expect.any(Error)
    );
    // still navigates afterwards
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});

test("logout failure (non-ok): alerts and does NOT navigate", async () => {
  mockInitialLoad();

  // Mock logout POST -> 400
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    text: async () => "Bad request",
  });

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /log-out/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Log-out failed: Bad request");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

test("Sign-up button triggers the apply flow", async () => {
  const testEvents = [{
    id: "5e9d21a6-95b7-4b55-a8f7-9648bdf782cb",
    organizerId: "51d6573c-5d62-4b3d-9853-b09e6095e367",
    jobName: "event 8",
    description: "moon stuff",
    startTime: "2099-10-23T01:00:00.000Z",
    endTime: "2099-10-24T02:00:00.000Z",
    location: "moon",
    createdAt: "2025-10-29T05:09:05.344Z"
  }];

  mockInitialLoad(testEvents);

  // Mock the apply call
  mockApplyToEvent.mockResolvedValueOnce({
    ok: true,
    status: 201,
    json: async () => ({ message: "Applied successfully" }),
  });

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText(/event 8/i));
  fireEvent.click(screen.getByRole("button", { name: /Apply/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith(
      "Application submitted! An organizer will review it."
    );
  });
});

test("logout: non-OK response triggers alert and returns", async () => {
  mockInitialLoad();

  // POST /auth/logout -> not ok
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    text: async () => "Bad request",
  });

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /log-out/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Log-out failed: Bad request");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

test("logout: OK but non-204 parses JSON then navigates", async () => {
  mockInitialLoad();

  // POST /auth/logout -> ok, 200, valid JSON
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ message: "bye" }),
  });

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  //gotta log in the user.

  await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /log-out/i }));

  await waitFor(() => {
    expect(window.alert).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
