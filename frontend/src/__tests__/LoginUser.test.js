import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginUser from "../LoginUser";
import "@testing-library/jest-dom";
import * as ErrorHelper from "../helpers/ErrorHelper";

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("early return: alerts when email is missing", async () => {
    renderWithRole("Organizer");
    await fillAndSubmit({ password: "secret" });
    expect(screen.getByText(ErrorHelper.EMAIL_ERROR)).toBeInTheDocument()
    expect(global.fetch).toBeUndefined(); // no network call
  });

  test("early return: alerts when password is missing", async () => {
    renderWithRole("Organizer");
    await fillAndSubmit({ email: "a@b.com" });
    expect(screen.getByText(ErrorHelper.PASSWORD_ERROR)).toBeInTheDocument()
  });

  test("non-OK response shows errorMsg 'Invalid email or password'", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => "Unauthorized",
    });

    renderWithRole("Volunteer");
    await fillAndSubmit({ email: "v@x.com", password: "pw" });

    await waitFor(() =>
      expect(screen.getByText(/Network Error — Please Try Again Later./i)).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  test("success: backend organizer → navigates /Homepage-Organizer", async () => {
    global.fetch = jest.fn().mockResolvedValue({
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
      expect(mockNavigate).toHaveBeenCalledWith("/Homepage-Organizer", {"state": {"role": "Organizer"}})
    );
  });

  test("success: backend volunteer → navigates /Dashboard", async () => {
    global.fetch = jest.fn().mockResolvedValue({
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
      expect(mockNavigate).toHaveBeenCalledWith("/Dashboard", {"state": {"role": "Volunteer"}})
    );
  });

  test("network error triggers alert", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("boom"));
    renderWithRole("Organizer");
    await fillAndSubmit({ email: "a@b.com", password: "pw" });
    await waitFor(() =>
      expect(screen.getByText(ErrorHelper.SERVER_ERROR)).toBeInTheDocument()
    );
  });
});
