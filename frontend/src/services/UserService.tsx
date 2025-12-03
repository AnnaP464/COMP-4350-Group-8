import apiFetch from "../api/ApiFetch";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Login/register/logout don't use apiFetch because they happen before
// we have a token or are managing the token lifecycle themselves

export function logout() {
  return fetch(`${API_URL}/v1/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}

export function login(email: string, password: string, role: string) {
  return fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
      role,
    }),
  });
}

export function register(username: string, email: string, password: string, role: string) {
  return fetch(`${API_URL}/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
      role,
    }),
  });
}

export function refreshToken() {
  return fetch(`${API_URL}/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
}

// These use apiFetch for automatic token handling and refresh

export function authMe(): Promise<Response> {
  return apiFetch("/v1/auth/me");
}

export function getAvatar(formData: FormData): Promise<Response> {
  return apiFetch("/v1/users/me/avatar", {
    method: "POST",
    body: formData,
  });
}

export function fetchProfile(): Promise<Response> {
  return apiFetch("/v1/users/me/profile");
}

export type VolunteerStats = {
  totalMinutes: number;
  totalHours: number;
  jobsCompleted: number;
  upcomingJobs: number;
};

export function fetchVolunteerStats(): Promise<Response> {
  return apiFetch("/v1/users/me/stats");
}
