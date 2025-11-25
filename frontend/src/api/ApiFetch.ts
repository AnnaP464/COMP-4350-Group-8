const API_URL = "http://localhost:4000";

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) return null;
  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  return data.access_token;
}

// Wrapper for all authenticated requests
export async function apiFetch(url: string, options: RequestInit = {}) {
  let token = localStorage.getItem("access_token");
  console.log("inside api fetch\n")
  console.log(token)
  const headers = {
    ...(options.headers || {}),
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  let res = await fetch(API_URL + url, {
    ...options,
    headers,
    credentials: "include",
  });

  // If token expired → try refresh
  if (res.status === 401) {
    //  localStorage.clear();
       return res; // or redirect to login

    // const newToken = await refreshAccessToken();

    // if (!newToken) {
    //   // User must log in again
    //   localStorage.clear();
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