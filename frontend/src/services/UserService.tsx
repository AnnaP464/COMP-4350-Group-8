const API_URL = "http://localhost:4000";

export function logout() {
  const content = fetch(`${API_URL}/v1/auth/logout`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
    }
  });
  return content;
}

export function login(email: string, password: string, role: string) {
  const content = fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      role,
    }),
  });
  return content;
}

export function authMe(token: string | null) {
  const content = fetch(`${API_URL}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return content;
}

export function register(username: string, email: string, password: string, role: string) {
  const content = fetch(`${API_URL}/v1/auth/register`, {
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
  return content;
}

export function getAvatar (token: string | null, formData: FormData) {
  const content = fetch(`${API_URL}/v1/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return content;
}

export function fetchProfile(token: string | null) {
  const content = fetch(`${API_URL}/v1/users/me/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return content;
}

export function refreshToken() {
  const content = fetch(`${API_URL}/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  return content;
}