import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HomepageOrganizer from "../HomepageOrganizer.tsx";
import OrganizerProfile from "../OrganizerProfile.tsx";
import * as AlertHelper from "../helpers/AlertHelper";

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
  jest.resetAllMocks();
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---- tests ----
describe("Homepage-Organizer", () => {
  test("goes back to login when no token (early return)", () => {
    setupLocalStorageMock({
      // no access_token
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    renderAt();
    expect(screen.getByText(/LOGIN PAGE/i)).toBeInTheDocument();
  });

  test("fetches events with bearer token; renders empty-state when none", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderAt();
    // initial skeleton exists
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/v1/events?mine=1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Accept: "application/json",
            Authorization: "Bearer TKN",
          }),
        })
      )
    );

    expect(
      screen.getByText(/No job postings posted yet./i)
    ).toBeInTheDocument();
    // profile/username header is rendered after user is set
    expect(screen.getByText(/HiveHand - org1/i)).toBeInTheDocument();
  });

  test("open/close Create Event modal", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderAt();

    // open
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // close by clicking Cancel
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("create event 401 triggers alert and redirect to /User-login", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET ok
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // POST -> 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      });

      const now = new Date();
      now.setDate(now.getDate() + 1)  
  
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
    
      const startTime = `${year}-${month}-${day}T02:00`;
      const endTime = `${year}-${month}-${day}T03:00`;
  
      renderAt();
      fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));
  
      fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Foo" } });
      fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
      fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
      fireEvent.change(screen.getByPlaceholderText(/Location \*/i), { target: { value: "Here" } });
      fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Bar" } });
      fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));
  
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Your session has expired. Please log in again.");
      expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
    });
  });

  test("profile panel toggles and shows Loading...", async () => {
    const ls = setupLocalStorageMock({
      access_token: "TKN",
      refresh_token: "RTK",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    global.fetch = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    renderAt();

    // open profile
    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });
});

describe("Homepage-Organizer — extra branches", () => {
  test("initial GET !res.ok returns early (empty-state still renders)", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => "server broke",
    });

    renderAt();

    // should have attempted GET with bearer
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/v1/events?mine=1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Accept: "application/json",
            Authorization: "Bearer TKN",
          }),
        })
      )
    );

    // since events never set, UI shows empty state
    expect(screen.getByText(/No job postings posted yet\./i)).toBeInTheDocument();
  });

  test("Create Event early validations: jobName required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    // leave jobName blank
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });

    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));
    expect(window.alert).toHaveBeenCalledWith("Job name is required");
  });

  test("Create Event early validations: Start time required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });

    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));
    expect(window.alert).toHaveBeenCalledWith("Start time is required");
  });

  test("Create Event early validations: End time required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    const startTime = `${year}-${month}-${day}T02:00`;

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });

    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));
    expect(window.alert).toHaveBeenCalledWith("End time is required");
  });

  test("Create Event early validations: location required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Details" } });

    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));
    expect(window.alert).toHaveBeenCalledWith("Location is required");
  });

  test("Create Event early validations: description required", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    const now = new Date();
    now.setDate(now.getDate() + 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });

    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));
    expect(window.alert).toHaveBeenCalledWith("Description is required");
  });

  test("Create Event non-OK => alerts failure text from server", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET ok (no events), POST returns !ok with text
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "bad payload",
      });

      const now = new Date();
      now.setDate(now.getDate() + 1)
  
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
    
      const startTime = `${year}-${month}-${day}T02:00`;
      const endTime = `${year}-${month}-${day}T03:00`;
  
      renderAt();
      fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));
  
      fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Bad" } });
      fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
      fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
      fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
      fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Oops" } });
      fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));
  
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Failed to create job: bad payload")
    );
  });

  test("Create Event Success", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET ok (no events), POST returns !ok with text
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "Event Created Successfully",
      });

    const now = new Date();
    now.setDate(now.getDate() + 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Bad" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Oops" } });
    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Application submitted! An organizer will review it.")
    );
  });

  test("Fail to Create Event with the end time after start time", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET ok (no events), POST returns !ok with text
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "Event Created Successfully",
      });

    const now = new Date();
    now.setDate(now.getDate() + 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    const endTime = `${year}-${month}-${day}T02:00`;
    const startTime = `${year}-${month}-${day}T03:00`;

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Bad" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Oops" } });
    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("End time must be after start time")
    );
  });

  test("Fail to Create Event with start time in the past", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET ok (no events), POST returns !ok with text
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "Event Created Successfully",
      });

    const now = new Date();
    now.setDate(now.getDate() - 1)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    const startTime = `${year}-${month}-${day}T02:00`;
    const endTime = `${year}-${month}-${day}T03:00`;

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Bad" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: startTime } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: endTime } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Oops" } });
    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(AlertHelper.CAUSALITY_ERROR)
    );
  });

  test("Closing the modal by clicking the backdrop", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { container } = renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // backdrop is the parent wrapper (has onClick to close). Click outside dialog.
    fireEvent.mouseDown(dialog); // mousedown on backdrop
    fireEvent.click(dialog);     // click backdrop
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

    global.fetch = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // logout POST -> !ok
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "whoops" });

    renderAt();

    // open profile to reveal its logout button, then click it
    fireEvent.click(screen.getByRole("button", { name: /^Log-out$/i }));

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

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // initial GET
      .mockRejectedValueOnce(new Error("net down"));             // logout POST

    renderAt();

    fireEvent.click(screen.getByRole("button", { name: /^Log-out$/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(AlertHelper.SERVER_ERROR)
    );
  });
});

