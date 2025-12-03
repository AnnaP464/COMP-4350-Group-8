import * as AuthService from "../services/AuthService";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Singleton promise for token refresh - all concurrent 401s share this
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, return the existing promise so all callers wait for the same refresh
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the HttpOnly refresh cookie
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      AuthService.setToken(data.access_token);
      return data.access_token;
    } catch {
      return null;
    } finally {
      // Clear the promise after a short delay to handle rapid successive 401s
      setTimeout(() => {
        refreshPromise = null;
      }, 100);
    }
  })();

  return refreshPromise;
}

/**
 * Wrapper for all authenticated API requests.
 * Automatically handles token refresh on 401 responses.
 *
 * @param url - API endpoint path (e.g., "/v1/events")
 * @param options - fetch options (method, body, etc.)
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = AuthService.getToken();

  // Build headers, preserving any custom headers passed in
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Add auth header if we have a token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  // IMPORTANT: don't force JSON Content-Type for FormData
  // Add Content-Type for JSON if there's a body and no Content-Type set
  if (options.body && !headers["Content-Type"] && !isFormData) {
    headers["Content-Type"] = "application/json";
  }



  // Make the initial request
  let res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // If 401, try to refresh the token
  if (res.status === 401) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      // Refresh failed - clear auth state and redirect to login
      AuthService.logout();
      window.location.href = "/";
      return res;
    }

    // Retry the original request with the new token
    headers["Authorization"] = `Bearer ${newToken}`;
    res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: "include",
    });
  }

  return res;
}

export default apiFetch;