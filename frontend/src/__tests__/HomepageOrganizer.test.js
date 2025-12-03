import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HomepageOrganizer from "../HomepageOrganizer.tsx";
import OrganizerProfile from "../OrganizerProfile.tsx";
import * as AlertHelper from "../helpers/AlertHelper";

// --- Mocks ---
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuthGuard to always return "authorized" so component renders
jest.mock("../hooks/useAuthGuard", () => ({
  __esModule: true,
  default: jest.fn(() => "authorized"),
}));

// Mock EventService
const mockFetchMyEvents = jest.fn();
const mockCreateEvent = jest.fn();
jest.mock("../services/EventService", () => ({
  __esModule: true,
  fetchMyEvents: (...args) => mockFetchMyEvents(...args),
  createEvent: (...args) => mockCreateEvent(...args),
}));

// Mock AuthService
const mockGetToken = jest.fn();
const mockGetUser = jest.fn();
const mockLogout = jest.fn();
jest.mock("../services/AuthService", () => ({
  __esModule: true,
  getToken: () => mockGetToken(),
  getUser: () => mockGetUser(),
  logout: () => mockLogout(),
}));

// Mock GeofenceMap component (uses react-leaflet which doesn't work in Jest)
jest.mock("../components/GeofenceMap", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-geofence-map">Mock Map</div>,
}));

// ---- helpers ----
const setupLocalStorageMock = (seed = {}) => {
  const store = { ...seed };
  const ls = {
    getItem: jest.fn((k) => (k in store ? store[k] : null)),
    setItem: jest.fn((k, v) => { store[k] = v; }),
    removeItem: jest.fn((k) => { delete store[k]; }),
    clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); })
  };
  Object.defineProperty(window, "localStorage", { value: ls, writable: true });
  return ls;
};

const renderAt = (initial = "/Homepage-Organizer") =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/Homepage-Organizer" element={<HomepageOrganizer />} />
        <Route path="/User-login" element={<div>LOGIN PAGE</div>} />
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/Homepage-Organizer/profile" element={<OrganizerProfile />} />
      </Routes>
    </MemoryRouter>
  );

// crypto.randomUUID is used for 204 fallback creation
beforeAll(() => {
  if (!global.crypto) {
    global.crypto = {};
  }
  if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = jest.fn(() => "uuid-1234");
  }
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = jest.fn();

  // Default AuthService mocks - tests can override these
  mockGetToken.mockReturnValue("test-token");
  mockGetUser.mockReturnValue(JSON.stringify({ username: "org1", email: "o@example.com" }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---- tests ----
describe("Homepage-Organizer", () => {
  test("fetches events with EventService; renders empty-state when none", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // Mock fetchMyEvents
    mockFetchMyEvents.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderAt();

    await waitFor(() =>
      expect(mockFetchMyEvents).toHaveBeenCalled()
    );

    expect(
      screen.getByText(/No job postings posted yet./i)
    ).toBeInTheDocument();
    // profile/username header is rendered after user is set
    expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
  });

  test("open/close Create Event modal", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    // open
    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // close by clicking Cancel
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("create event 401 triggers alert", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET ok, POST -> 401
    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });
    mockCreateEvent.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "unauthorized",
    });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Foo" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/Location \*/i), { target: { value: "Here" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Bar" } });
    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to create job: unauthorized");
    });
  });

  test("profile button navigates to profile page", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      refresh_token: "RTK",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    // click profile button
    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/Homepage-Organizer/profile", expect.anything());
    });
  });
});

describe("Homepage-Organizer — extra branches", () => {
  test("initial GET !res.ok returns early (empty-state still renders)", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    mockFetchMyEvents.mockResolvedValueOnce({
      ok: false,
      text: async () => "server broke",
    });

    renderAt();

    await waitFor(() =>
      expect(mockFetchMyEvents).toHaveBeenCalled()
    );

    // since events never set, UI shows empty state
    expect(screen.getByText(/No job postings posted yet\./i)).toBeInTheDocument();
  });

  test("Create Event early validations: jobName required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    // leave jobName blank
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });

    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));
    expect(window.alert).toHaveBeenCalledWith("Job name is required");
  });

  test("Create Event early validations: Start time required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });

    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));
    expect(window.alert).toHaveBeenCalledWith("Start time is required");
  });

  test("Create Event early validations: End time required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T02:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });

    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));
    expect(window.alert).toHaveBeenCalledWith("End time is required");
  });

  test("Create Event early validations: location required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });

    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));
    expect(window.alert).toHaveBeenCalledWith("Location is required");
  });

  test("Create Event early validations: description required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });

    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));
    expect(window.alert).toHaveBeenCalledWith("Description is required");
  });

  test("Create Event non-OK => alerts failure text from server", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET ok (no events), POST returns !ok with text
    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });
    mockCreateEvent.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "bad payload",
    });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Bad" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Oops" } });
    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Failed to create job: bad payload")
    );
  });

  test("Create Event Success", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET ok (no events), POST returns ok
    mockFetchMyEvents.mockResolvedValue({ ok: true, json: async () => [] });
    mockCreateEvent.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "new-event-id" }),
    });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Good" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });
    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));

    // On success, should show event created alert
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(AlertHelper.EVENT_CREATED)
    );
  });

  test("Fail to Create Event with the end time after start time", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const endTime = `${year}-${month}-${day}T02:00`;
    const startTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Bad" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Oops" } });
    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("End time must be after start time")
    );
  });

  test("Fail to Create Event with start time in the past", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() - 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Bad" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Oops" } });
    fireEvent.click(screen.getByRole("button", { name: /Next: Geofence/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(AlertHelper.CAUSALITY_ERROR)
    );
  });

  test("Closing the modal by clicking the backdrop", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /New Event/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // backdrop is the parent wrapper (has onClick to close). Click outside dialog.
    fireEvent.mouseDown(dialog);
    fireEvent.click(dialog);
    await waitFor(() =>
      expect(screen.queryByText(/Create a job post/i)).not.toBeInTheDocument()
    );
  });

  test("Logout non-OK alerts with server text", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      refresh_token: "RTK",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    // logout POST -> !ok via raw fetch
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => "whoops" });

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign Out/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Log-out failed: whoops")
    );
  });

  test("Logout network error shows alert", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      refresh_token: "RTK",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    mockFetchMyEvents.mockResolvedValueOnce({ ok: true, json: async () => [] });

    // logout POST throws via raw fetch
    global.fetch.mockRejectedValueOnce(new Error("net down"));

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, org1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign Out/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(AlertHelper.SERVER_ERROR)
    );
  });
});
