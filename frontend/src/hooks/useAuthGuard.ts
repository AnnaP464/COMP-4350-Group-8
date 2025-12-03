/*
 * Proactive auth check on page load.
 * Uses apiFetch which handles token refresh automatically.
 *
 * If /v1/auth/me returns 200 → status "authorized".
 * If /v1/auth/me returns 401 (after refresh attempt) → "unauthorized" + redirect.
 * On network error → "unauthorized" + redirect.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../api/ApiFetch";

type AuthStatus = "checking" | "authorized" | "unauthorized";

export default function useAuthGuard(role?: string | null): AuthStatus {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    async function check() {
      try {
        // apiFetch handles token attachment and refresh automatically
        const res = await apiFetch("/v1/auth/me");

        if (res.ok) {
          setStatus("authorized");
        } else {
          // 401 means refresh also failed (apiFetch already tried)
          setStatus("unauthorized");
          if (role) {
            navigate("/User-login", { state: { role }, replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }
      } catch {
        // Network error
        setStatus("unauthorized");
        if (role) {
          navigate("/User-login", { state: { role }, replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    }

    check();
  }, [navigate, role]);

  return status;
}
