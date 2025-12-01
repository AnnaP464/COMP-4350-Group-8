import * as AuthService from "../services/AuthService";
import * as UserService from "../services/UserService";

const API_URL = "http://localhost:4000";

async function refreshAccessToken() {
  const res = await UserService.refreshToken();

  if (!res.ok) return null;
  const data = await res.json();
  AuthService.setToken(data.access_token);
  return data.access_token;
}

// Wrapper for all authenticated requests
export async function apiFetch(options: RequestInit = {}) {
  let token = AuthService.getToken();
  const headers = {
    ...(options.headers || {}),
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  let res = await fetch(API_URL + "/v1/auth/me", {
    ...options,
    headers,
    credentials: "include",
  });

  // If token expired → try refresh
  if (res.status === 401) {
    //  AuthService.clearLocalStorage();
       return res; // or redirect to login

    // const newToken = await refreshAccessToken();

    // if (!newToken) {
    //   // User must log in again
    //   AuthService.clearLocalStorage();
    //   return res; // or redirect to login
    // }

    // Retry the original request with new token
    // res = await fetch(API_URL + url, {
    //   ...options,
    //   headers: {
    //     ...headers,
    //     "Authorization": `Bearer ${newToken}`,
    //   },
    //   credentials: "include",
    // });
  }

  return res;
}

export default apiFetch;