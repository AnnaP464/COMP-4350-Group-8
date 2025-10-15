import React from "react";
import {render, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import Dashboard from "../Dashboard.tsx";
import { MemoryRouter } from "react-router-dom";


// --- Mocks ---
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  jest.clearAllMocks();
  // mock fetch per-test with sequence using mockResolvedValueOnce
  global.fetch = jest.fn();
  // mock alert
  jest.spyOn(window, "alert").mockImplementation(() => {});
  // mock console.error to avoid noisy logs (and to assert error path)
  jest.spyOn(console, "error").mockImplementation(() => {});
  // mock localStorage.removeItem
  jest.spyOn(window.localStorage.__proto__, "removeItem").mockImplementation(() => {});
});

// Helper to render with an initial GET /v1/ response (or failure)
function mockInitialEventsFetchOk(events = [{ id: 99, title: "Mock Event", date: "2025-12-12", duration: "1 hour" }]) {
  (global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => events,
  });
}
function mockInitialEventsFetchFail() {
  (global.fetch).mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => ({}),
  });
}


test("Tries to sign up for an event", async () => {
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    //Tries to bring up the menu of the sign up but its empty
    const buttons = screen.getAllByRole("button", { name: "Sign-up" });
    await userEvent.click(buttons[0]);
    expect(screen.queryByText("Welcome to your Dashboard 🎉"));
});

test("Will try to logout and go to the role selection screen", async () => {
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

    //redirects the user to the role selection screen
    const button = screen.getByRole("button", { name: "Log-out" });
    await userEvent.click(button);
    expect(screen.queryByText("Welcome to HiveHand"));
});



test("renders placeholder events immediately, then replaces with fetched events", async () => {
  // 1st fetch: GET events -> ok with one event "Mock Event"
  mockInitialEventsFetchOk([{ id: 1, title: "Replaced Event", date: "2025-10-31", duration: "2 hours" }]);

  render(<Dashboard />);

  // placeholder titles should appear first (from initial state)
  expect(screen.getByText(/Beach Cleanup/i)).toBeInTheDocument();
  expect(screen.getByText(/Food Drive/i)).toBeInTheDocument();
  expect(screen.getByText(/Tree Planting/i)).toBeInTheDocument();

  // after fetch resolves, new event should appear (and placeholders are replaced)
  await waitFor(() => {
    expect(screen.getByText(/Replaced Event/i)).toBeInTheDocument();
  });
});

test("handles fetch failure path (logs an error)", async () => {
  mockInitialEventsFetchFail();

  render(<Dashboard />);

  await waitFor(() => {
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching events:",
      expect.any(Error)
    );
  });
});

test("logout success (204): clears localStorage and navigates home", async () => {
  mockInitialEventsFetchOk(); // initial GET
  // 2nd fetch: POST /auth/logout -> 204
  (global.fetch).mockResolvedValueOnce({ ok: true, status: 204, text: async () => "" });

  render(<Dashboard />);

  fireEvent.click(screen.getByRole("button", { name: /log-out/i }));

  await waitFor(() => {
    expect(localStorage.removeItem).toHaveBeenCalledWith("user");
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  // Check that POST was called with the expected URL
  const calls = (global.fetch).mock.calls;
  expect(calls[calls.length - 1][0]).toMatch(/\/v1\/auth\/logout$/);
  expect(calls[calls.length - 1][1].method).toBe("POST");
});

test("logout success but non-204: attempts to parse JSON (and still navigates)", async () => {
  mockInitialEventsFetchOk(); // initial GET
  // 2nd fetch: POST /auth/logout -> 200 and json throws to hit inner catch
  (global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("bad json");
    },
  });

  render(<Dashboard />);

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
  mockInitialEventsFetchOk(); // initial GET
  // 2nd fetch: POST /auth/logout -> 400 with error text
  (global.fetch).mockResolvedValueOnce({
    ok: false,
    status: 400,
    text: async () => "Bad request",
  });

  render(<Dashboard />);

  fireEvent.click(screen.getByRole("button", { name: /log-out/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Log-out failed: Bad request");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

test("Sign-up button triggers the placeholder alert", async () => {
  mockInitialEventsFetchOk([
    { id: 7, title: "Cleanup Drive", date: "2025-11-11", duration: "3 hours" },
  ]);

  render(<Dashboard />);

  await waitFor(() => screen.getByText(/Cleanup Drive/i));
  fireEvent.click(screen.getByRole("button", { name: /sign-up/i }));

  expect(window.alert).toHaveBeenCalledWith(
    "Not quite finished yet, check back soon!"
  );
});



test("logout: non-OK response triggers alert and returns (covers !response.ok)", async () => {
  // 1) initial GET
  mockInitialEventsFetchOk();

  // 2) POST /auth/logout -> not ok (e.g., 400)
  (global.fetch).mockResolvedValueOnce({
    ok: false,
    status: 400,
    text: async () => "Bad request",
  });

  const { container } = render(<Dashboard />);

  // ensure initial fetch finishes
  await waitFor(() => expect(screen.getByText(/X/i)).toBeInTheDocument());

  // submit the form directly to guarantee onSubmit runs
  const form = container.querySelector("form");
  fireEvent.submit(form);

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Log-out failed: Bad request");
    // returned early, so no navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

test("logout: OK but non-204 parses JSON then navigates (covers response.status !== 204 and navigate)", async () => {
  // 1) initial GET
  mockInitialEventsFetchOk();

  // 2) POST /auth/logout -> ok, 200, valid JSON
  (global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ message: "bye" }),
  });

  const { container } = render(<Dashboard />);

  await waitFor(() => expect(screen.getByText(/X/i)).toBeInTheDocument());

  // submit the form (triggers handleLogout)
  const form = container.querySelector("form");
  fireEvent.submit(form);

  await waitFor(() => {
    // no error alert
    expect(window.alert).not.toHaveBeenCalled();
    // navigates home after the non-204 branch completes
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  // sanity: ensure 2nd fetch was POST /auth/logout
  const calls = (global.fetch).mock.calls;
  expect(calls[1][0]).toMatch(/\/v1\/auth\/logout$/);
  expect(calls[1][1].method).toBe("POST");
});
