import React, { useState } from "react";
import "./css/AuthChoice.css";  // Reuse same styling
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import * as RoleHelper from "./helpers/RoleHelper";
import {Link} from "react-router-dom";

const API_URL = "http://localhost:4000";
//const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const LoginUser: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const location = useLocation();
  const state = location.state as RoleHelper.AuthChoiceState;
  const role = state?.role;
  const subtitle = RoleHelper.subtitle(role)

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim()) return alert("Email is required.");
    if (!password.trim()) return alert("Password is required.");

    try {
      const response = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role, // send role too if your backend expects it
        }),
      });

      //login failed
      if (!response.ok) {
        await response.text();
        let msg = "Invalid email or password"
        //alert(`Login failed: ${err}`);
        setErrorMsg(msg);
        return;
      }

      const data = await response.json();

      //save user to local storage
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      //check if role of user while login matches with the backend role
      //prevents users to login from volunteer screen with organizer credentials
      //and vice versa
      const desiredRole = (role ?? "").toLowerCase();
      const backendRole = (data?.user?.role ?? "").toLowerCase();
      if(desiredRole && backendRole && desiredRole !== backendRole){
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setErrorMsg("Invalid email or password.");
        return;
      }

      // Route strictly by backend role
      if (backendRole === "organizer") {
        navigate("/Homepage-Organizer", { state: { role } });
      } else if (backendRole === "volunteer") {
        navigate("/Dashboard", { state: { role } });
      } else {
        // Unknown role: send them back or show a safe default
        setErrorMsg("Invalid email or password.");
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("Network error — could not connect to server.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">{role} Log-in</h2>
        <p className="subtitle">{subtitle}</p>
        {errorMsg && <p className="errorMsg">{errorMsg}</p>}
        <form onSubmit={handleSubmit} className="options" style={{ gap: 10 }}>
          <input
            className="text-input"
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            //required
          />

          <input
            className="text-input"
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            //required
          />

          <button className="option-btn" type="submit">
            Log-in
          </button>

          <Link to="/" className="guest-btn" style={{ textAlign: "center" }}>
            Back to Role Selection
          </Link>
        </form>
      </div>
    </div>
  );
};

export default LoginUser;
