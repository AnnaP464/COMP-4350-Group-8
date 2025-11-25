import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../api/ApiFetch"; // your wrapper

type AuthStatus = "checking" | "authorized" | "unauthorized";

export default function useAuthGuard(role: string) : AuthStatus {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {

     const token = localStorage.getItem("access_token");

    // If there is no token at all, don't auto-logout here.
    // The route itself (navigation logic) should prevent unauthenticated access.
    if (!token) {
      setStatus("unauthorized");
      if (role) {
        navigate("/User-login", { state: { role }, replace: true });
      } else {
        navigate("/User-login", { replace: true });
      }
      return;
    }

    async function check() {
        try 
        {
            // Make a authenticated request
            const res = await apiFetch("/v1/auth/me");  // returns current user
            
            if(res.ok){
                setStatus("authorized");
                return;
            }
            
            //token invalid/expired
            if (res.status === 401){
                localStorage.clear();
                setStatus("unauthorized");

                if (role) {
                navigate("/User-login", { state: { role }, replace: true });
                } else {
                navigate("/User-login", { replace: true });
                }
                return;
            }

            // Auth check failed
        } catch (err) {
            // Refresh failed → means session expired
            localStorage.clear();
            setStatus("unauthorized");
            if (role) {
            navigate("/User-login", { state: { role }, replace: true });
            } else {
            navigate("/User-login", { replace: true });
            }
        }
    }

    check();
  }, [navigate, role]);

  return status;
}
