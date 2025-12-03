import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginUser from "../LoginUser";
import "@testing-library/jest-dom";
import * as AlertHelper from "../helpers/AlertHelper";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const setupLocalStorageMock = () => {
  const store = {};
  const ls = {
    getItem: jest.fn((k) => (k in store ? store[k] : null)),
    setItem: jest.fn((k, v) => { store[k] = v; }),
    removeItem: jest.fn((k) => { delete store[k]; }),
    clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  };
  Object.defineProperty(window, "localStorage", { value: ls, writable: true });
  return ls;
};

const renderWithRole = (role = "Organizer") =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/User-login", state: { role: role }}]}>
      <Routes>
        <Route path="/User-login" element={<LoginUser />} />
        {/* explicit targets so navigation calls are meaningful */}
        <Route path="/Homepage-Organizer" element={<div>ORG HOME</div>} />
        <Route path="/Dashboard" element={<div>VOL DASH</div>} />
      </Routes>
    </MemoryRouter>
  );

const fillAndSubmit = async ({ email = "", password = "" } = {}) => {
  if (email) {
    fireEvent.change(screen.getByPlaceholderText(/Email \*/i), { target: { value: email } });
  }
  if (password) {
    fireEvent.change(screen.getByPlaceholderText(/Password \*/i), { target: { value: password } });
  }
  fireEvent.click(screen.getByRole("button", { name: /Log-in/i }));
};

describe("LoginUser handleSubmit coverage", () => {
  let alertSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    setupLocalStorageMock();
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    mockNavigate.mockReset();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("early return: alerts when email is missing", async () => {
    renderWithRole("Organizer");
    await fillAndSubmit({ password: "secret" });
    expect(screen.getByText(AlertHelper.EMAIL_ERROR)).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled(); // no network call
  });

  test("early return: alerts when password is missing", async () => {
    renderWithRole("Organizer");
    await fillAndSubmit({ email: "a@b.com" });
    expect(screen.getByText(AlertHelper.PASSWORD_ERROR)).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("non-OK response shows errorMsg from server", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid credentials" }),
    });

    renderWithRole("Volunteer");
    await fillAndSubmit({ email: "v@x.com", password: "pw" });

    await waitFor(() =>
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("success: backend organizer → navigates /Homepage-Organizer", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "A",
        refresh_token: "R",
        user: { role: "Organizer" },
      }),
    });

    renderWithRole("Organizer");
    await fillAndSubmit({ email: "o@x.com", password: "pw" });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/Homepage-Organizer")
    );
  });

  test("success: backend volunteer → navigates /Dashboard", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "A",
        refresh_token: "R",
        user: { role: "Volunteer" },
      }),
    });

    renderWithRole("Volunteer");
    await fillAndSubmit({ email: "v@x.com", password: "pw" });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/Dashboard")
    );
  });

  test("network error triggers error message", async () => {
    global.fetch.mockRejectedValue(new Error("boom"));
    renderWithRole("Organizer");
    await fillAndSubmit({ email: "a@b.com", password: "pw" });
    await waitFor(() =>
      expect(screen.getByText(AlertHelper.SERVER_ERROR)).toBeInTheDocument()
    );
  });

  test("role mismatch: trying to login as Volunteer with Organizer credentials", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "A",
        refresh_token: "R",
        user: { role: "Organizer" },
      }),
    });

    renderWithRole("Volunteer"); // Trying to login as Volunteer
    await fillAndSubmit({ email: "o@x.com", password: "pw" });

    await waitFor(() =>
      expect(screen.getByText(AlertHelper.LOG_IN_ERROR)).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
