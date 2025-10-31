import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HomepageOrganizer from "../HomepageOrganizer.tsx";

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

  /*
  test("normalizes snake_case fields and displays them", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // Return one event in snake_case to hit the normalization mapping
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "e1",
          job_name: "Food Drive",
          startTime: "2025-10-23T01:00",
          endTime: "2025-10-24T02:00",
          location: "Winnipeg",
          description: "Help sort donations",
          created_at: "2025-10-01T12:00",
        },
      ],
    });

    renderAt();

    // card content shows normalized fields
    await waitFor(() => {
      expect(screen.getByText("Food Drive")).toBeInTheDocument();
      expect(screen.getByText(/Starts at:/i)).toBeInTheDocument();
      expect(screen.getByText(/Ends at':/i)).toBeInTheDocument();
      expect(screen.getByText(/Location:/i)).toBeInTheDocument();
      expect(screen.getByText(/Winnipeg/i)).toBeInTheDocument();
      // createdAt is formatted by toLocaleString; just ensure something rendered
      expect(screen.getByText(/2025|AM|PM|:/)).toBeInTheDocument();
    });
  });
  */

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

/*
  test("create event success (201 JSON): adds card and resets form", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET (no events)
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // POST create -> returns JSON of created event
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: "server-id-1",
          jobName: "Beach Cleanup",
          startTime: "2025-10-23T01:00:00.000Z",
          endTime: "2025-10-24T02:00",
          location: "St. Vital",
          description: "Bring gloves",
          createdAt: "2025-10-10T10:00:00.000Z",
        }),
      });

    renderAt();

    // open modal
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));
    // fill fields
    fireEvent.change(screen.getByPlaceholderText(/Job name \* /i), { target: { value: "Beach Cleanup" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \* /i), { target: { value: "2025-10-23T01:00" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \* /i), { target: { value: "2025-10-24T02:00" } });
    fireEvent.change(screen.getByPlaceholderText(/Location \* /i), { target: { value: "St. Vital" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \* /i), { target: { value: "Bring gloves" } });
    // submit
    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));

    // modal closes and card appears
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Beach Cleanup")).toBeInTheDocument();
      expect(screen.getByText(/Start Time:/i)).toBeInTheDocument();
      expect(screen.getByText(/2025-10-23T01:00/i)).toBeInTheDocument();
    });

    // POST called with bearer header
    const postCall = global.fetch.mock.calls.find(c => c[0].includes("/v1/org_events") && c[1]?.method === "POST");
    expect(postCall).toBeTruthy();
    expect(postCall[1].headers.Authorization).toBe("Bearer TKN");
  });

  

  test("create event 204/no-body fallback uses randomUUID and still adds card", async () => {
    setupLocalStorageMock({
      access_token: "TKN",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    // initial GET
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // POST create -> ok, but no json body (simulate 204)
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          // make json() throw to trigger fallback path
          throw new Error("no body");
        },
      });

    renderAt();

    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));
    fireEvent.change(screen.getByPlaceholderText(/Job name \* /i), { target: { value: "Trees" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \* /i), { target: { value: "2025-10-23T01:00" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \* /i), { target: { value: "2025-10-24T02:00" } });
    fireEvent.change(screen.getByPlaceholderText(/Location \* /i), { target: { value: "UM Campus" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \* /i), { target: { value: "Plant saplings" } });
    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));

    await waitFor(() => {
      expect(screen.getByText("Trees")).toBeInTheDocument();
      //expect(screen.getByText(/2 hrs/i)).toBeInTheDocument();
      expect(global.crypto.randomUUID).toHaveBeenCalled();
    });
  });
  */

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

    renderAt();

    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));
    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Foo" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: "2025-10-23T01:00" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: "2025-10-24T02:00" } });
    fireEvent.change(screen.getByPlaceholderText(/Location \*/i), { target: { value: "Here" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Bar" } });
    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Your session has expired. Please log in again.");
      expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
    });
  });

  test("profile panel toggles and shows organizer info; logout clears tokens and POSTs /auth/logout", async () => {
    const ls = setupLocalStorageMock({
      access_token: "TKN",
      refresh_token: "RTK",
      user: JSON.stringify({ username: "org1", email: "o@example.com" }),
    });

    global.fetch = jest
      .fn()
      // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // logout POST
      .mockResolvedValueOnce({ ok: true, status: 204, text: async () => "" });

    renderAt();

    // open profile
    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));
    expect(screen.getByText(/Organizer/i)).toBeInTheDocument();
    expect(screen.getByText("org1")).toBeInTheDocument();
    expect(screen.getByText("o@example.com")).toBeInTheDocument();
    // events count (0)
    expect(screen.getByText("0")).toBeInTheDocument();

    // click Log-out (inside aside)
    fireEvent.click(screen.getByRole("button", { name: /^Log-out$/i }));

    await waitFor(() => {
      // navigated home
      expect(screen.getByText("HOME")).toBeInTheDocument();
    });

    // localStorage cleared
    expect(ls.removeItem).toHaveBeenCalledWith("user");
    expect(ls.removeItem).toHaveBeenCalledWith("access_token");
    expect(ls.removeItem).toHaveBeenCalledWith("refresh_token");

    // logout POST called
    const post = global.fetch.mock.calls.find(c => c[0] === "http://localhost:4000/v1/auth/logout");
    expect(post).toBeTruthy();
    expect(post[1].method).toBe("POST");
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

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    // leave jobName blank
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: "2025-10-23T01:00" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: "2025-10-24T02:00" } });
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

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: "2025-10-24T02:00" } });
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

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: "2025-10-23T01:00" } });
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

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: "2025-10-23T01:00" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: "2025-10-24T02:00" } });
    // missing location
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

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "A" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: "2025-10-23T01:00" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: "2025-10-24T02:00" } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Here" } });
    // missing description

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

    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    fireEvent.change(screen.getByPlaceholderText(/Job name \*/i), { target: { value: "Bad" } });
    fireEvent.change(screen.getByPlaceholderText(/Start time \*/i), { target: { value: "2025-10-23T01:00" } });
    fireEvent.change(screen.getByPlaceholderText(/End time \*/i), { target: { value: "2025-10-24T02:00" } });
    fireEvent.change(screen.getByPlaceholderText(/^Location \*/i), { target: { value: "Somewhere" } });
    fireEvent.change(screen.getByPlaceholderText(/Job description \*/i), { target: { value: "Oops" } });
    fireEvent.click(screen.getByRole("button", { name: /Post Job/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Failed to create job: bad payload")
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
    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));
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

    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Log-out$/i }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Network error — could not connect to server.")
    );
  });
});

