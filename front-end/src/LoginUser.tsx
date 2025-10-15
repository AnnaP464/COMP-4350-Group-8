import React, { useState } from "react";
import "./authChoice.css";  // Reuse same styling
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const LoginUser: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const role = queryParams.get("role");
  const navigate = useNavigate();

  let subtitle = "";
  if(role === "Organizer"){
    subtitle = "Manage your events and volunteers";
  } else if(role === "Volunteer"){
    subtitle = "Join and contribute to causes";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim()) return alert("Email is required.");
    if (!password.trim()) return alert("Password is required.");

    try {
      const response = await fetch("http://localhost:4000/v1/auth/login", {
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
        const err = await response.text();
        let msg = "Invalid email or password"
        //alert(`Login failed: ${err}`);
        setErrorMsg(msg);
        return;
      }

      const data = await response.json();
      localStorage.setItem("user", JSON.stringify(data.user));

      //route by role
      console.log(data);
      if (role === "Organizer") {
        navigate("/Homepage-Organizer");
      } else {
        navigate("/Dashboard");
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

        {/* only redner when there is log-in error */}
        {errorMsg && <p className="errorMsg">{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="options" style={{ gap: 10 }}>

          <input
            className="text-input"
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="text-input"
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="option-btn" type="submit">
            Log-in
          </button>

          <a href="/" className="guest-btn" style={{ textAlign: "center" }}>
            Back to Role Selection
          </a>
        </form>
      </div>
    </div>
  );
};

export default LoginUser;