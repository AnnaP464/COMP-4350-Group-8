/*
 *If there’s no access token → status "unauthorized" and redirect.

 *If /v1/auth/me returns 200 → status "authorized".

 * If /v1/auth/me returns 401 → "unauthorized" + redirect.

 * If /v1/auth/me returns any other non-OK (404/500/etc.) → "unauthorized" (no redirect).

 * On network / CORS error → "unauthorized" + redirect.
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../api/ApiFetch";

type AuthStatus = "checking" | "authorized" | "unauthorized";

// helper function: NO hooks here, just uses the navigate we pass in
function redirectToLoginOrHome(
  navigate: ReturnType<typeof useNavigate>,
  role?: string | null
) {
  alert("You are not logged in.");
  if (role) {
    navigate("/User-login", { state: { role }, replace: true });
  } else {
    navigate("/", { replace: true });
  }
}

export default function useAuthGuard(role?: string | null): AuthStatus {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setStatus("unauthorized");
      redirectToLoginOrHome(navigate, role);
      return;
    }

    async function check() {
      try {
        // Make an authenticated request
        const res = await apiFetch("/v1/auth/me"); // returns current user
        console.log(res.status);

        if (res.ok) {
          setStatus("authorized");
        }
        // token invalid/expired
        else if (res.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          setStatus("unauthorized");
          redirectToLoginOrHome(navigate, role);
        } else {
          // other server error → unauthorized, but no redirect
          setStatus("unauthorized");
        }
      } catch (err) {
        // network / CORS error → treat like expired session
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setStatus("unauthorized");
        redirectToLoginOrHome(navigate, role);
      }
    }

    check();
  }, [navigate, role]);

  return status;
}
