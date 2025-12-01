/*
 *If there’s no access token → status "unauthorized" and redirect.

 *If /v1/auth/me returns 200 → status "authorized".

 * If /v1/auth/me returns 401 → "unauthorized" + redirect.

 * If /v1/auth/me returns any other non-OK (404/500/etc.) → "unauthorized" (no redirect).

 * On network / CORS error → "unauthorized" + redirect.
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../api/ApiFetch"; // your wrapper
import * as AuthService from "../services/AuthService";

type AuthStatus = "checking" | "authorized" | "unauthorized";

export default function useAuthGuard(role: string) : AuthStatus {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {

    const token = AuthService.getToken();

    // If there is no token at all, don't auto-logout here.
    // The route itself (navigation logic) should prevent unauthenticated access.
    if (!token) {
      setStatus("unauthorized");

      //if role is valid, redirect to login page
      //else redirect to / (entry point of app)
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
            const res = await apiFetch();
            console.log(res.status);
            if(res.ok){
                setStatus("authorized");
            }
            //token invalid/expired
            else if (res.status === 401){
                AuthService.clearLocalStorage();
                setStatus("unauthorized");

                //if role is valid, redirect to login page
                //else redirect to / (entry point of app)
                if (role) {
                navigate("/User-login", { state: { role }, replace: true });
                } else {
                navigate("/User-login", { replace: true }); 
                }
            }
            else{
                setStatus("unauthorized");
            }

            // Auth check failed
        } catch (err) {
            // Refresh failed → means session expired
            AuthService.clearLocalStorage();
            setStatus("unauthorized");
            if (role) {
            navigate("/User-login", { state: { role }, replace: true });
            } else {
            navigate("/User-login", { replace: true });
            }
        }
    }

    check();
  }, [navigate, role]); //use effect ends

  return status;
}
