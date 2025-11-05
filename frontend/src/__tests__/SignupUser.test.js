import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import SignupUser from "../SignupUser";

// mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRole = (role = "Organizer") =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/User-Signup", state: { role: role }}]}>
      <Routes>
        <Route path="/User-signup" element={<SignupUser />} />
        {/* we don't render the real Login page; we just assert navigate() args */}
        <Route path="/User-login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("SignupUser", () => {
  let alertSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    mockNavigate.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders Organizer copy and placeholder", () => {
    renderWithRole("Organizer");
    expect(screen.getByText(/Organizer Sign-up/i)).toBeInTheDocument(); // title
    expect(screen.getByText(/Manage your events and volunteers/i)).toBeInTheDocument(); // subtitle
    expect(screen.getByPlaceholderText(/Organization name \*/i)).toBeInTheDocument(); // role-specific field
  });

  test("renders Volunteer copy and placeholder", () => {
    renderWithRole("Volunteer");
    expect(screen.getByText(/Volunteer Sign-up/i)).toBeInTheDocument();
    expect(screen.getByText(/Join and contribute to causes/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your username \*/i)).toBeInTheDocument();
  });

  // --- Validation early returns in handleSubmit():contentReference[oaicite:1]{index=1} ---
  test("alerts when name is missing", async () => {
    renderWithRole("Organizer");
    // fill only email/passwords
    fireEvent.change(screen.getByPlaceholderText(/Email \*/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText(/^Password \*/i), { target: { value: "secret" } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password \*/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign-up/i }));
    expect(screen.queryByText("Name is required.")).toBeInTheDocument();
  });

  test("alerts when email is missing", async () => {
    renderWithRole("Volunteer");
    fireEvent.change(screen.getByPlaceholderText(/Your username \*/i), { target: { value: "volly" } });
    fireEvent.change(screen.getByPlaceholderText(/^Password \*/i), { target: { value: "pw" } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password \*/i), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign-up/i }));
    expect(screen.queryByText("Email is required.")).toBeInTheDocument();
  });

  test("alerts when password is missing", async () => {
    renderWithRole("Volunteer");
    fireEvent.change(screen.getByPlaceholderText(/Your username \*/i), { target: { value: "volly" } });
    fireEvent.change(screen.getByPlaceholderText(/Email \*/i), { target: { value: "v@x.com" } });
    // no password
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password \*/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign-up/i }));
    expect(screen.queryByText("Password is required.")).toBeInTheDocument();
  });

  test("alerts when passwords do not match", async () => {
    renderWithRole("Organizer");
    fireEvent.change(screen.getByPlaceholderText(/Organization name \*/i), { target: { value: "OrgX" } });
    fireEvent.change(screen.getByPlaceholderText(/Email \*/i), { target: { value: "o@x.com" } });
    fireEvent.change(screen.getByPlaceholderText(/^Password \*/i), { target: { value: "secret1" } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password \*/i), { target: { value: "secret2" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign-up/i }));
    expect(screen.queryByText("Passwords do not match.")).toBeInTheDocument();
  });

  // --- Network branches in handleSubmit():contentReference[oaicite:2]{index=2} ---
  test("non-OK response alerts with backend text", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => "email already used",
    });

    renderWithRole("Volunteer");
    fireEvent.change(screen.getByPlaceholderText(/Your username \*/i), { target: { value: "volly" } });
    fireEvent.change(screen.getByPlaceholderText(/Email \*/i), { target: { value: "v@x.com" } });
    fireEvent.change(screen.getByPlaceholderText(/^Password \*/i), { target: { value: "pw" } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password \*/i), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign-up/i }));

    await waitFor(() =>
      expect(screen.queryByText("Unexpected error from server")).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("successful signup navigates to '/User-login', state: { role : role }", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "u1" }),
    });

    renderWithRole("Organizer");
    fireEvent.change(screen.getByPlaceholderText(/Organization name \*/i), { target: { value: "OrgX" } });
    fireEvent.change(screen.getByPlaceholderText(/Email \*/i), { target: { value: "o@x.com" } });
    fireEvent.change(screen.getByPlaceholderText(/^Password \*/i), { target: { value: "pw" } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password \*/i), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign-up/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/User-login", {state: {"role": "Organizer" }})
    );

    // fetch called with correct endpoint & payload:contentReference[oaicite:3]{index=3}
    const call = global.fetch.mock.calls[0];
    expect(call[0]).toBe("http://localhost:4000/v1/auth/register");
    expect(call[1].method).toBe("POST");
    expect(call[1].headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(call[1].body);
    expect(body).toEqual({
      username: "OrgX",
      email: "o@x.com",
      password: "pw",
      role: "Organizer",
    });
  });

  test("network error path alerts with concatenated message", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("boom"));

    renderWithRole("Volunteer");
    fireEvent.change(screen.getByPlaceholderText(/Your username \*/i), { target: { value: "volly" } });
    fireEvent.change(screen.getByPlaceholderText(/Email \*/i), { target: { value: "v@x.com" } });
    fireEvent.change(screen.getByPlaceholderText(/^Password \*/i), { target: { value: "pw" } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password \*/i), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign-up/i }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Network error — could not connect to server."))
    );
  });
});
