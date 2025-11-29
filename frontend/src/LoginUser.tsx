import React, { useState } from "react";
import "./css/AuthChoice.css";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import * as RoleHelper from "./helpers/RoleHelper";
import * as AlertHelper from "./helpers/AlertHelper";
import {Link} from "react-router-dom";

const API_URL = "http://localhost:4000";

const LoginUser: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const location = useLocation();
  const state = location.state;
  const role = state?.role;
  const subtitle = RoleHelper.subtitle(role)

  const navigate = useNavigate();

  /*-----------------------------------------------------
                  Log in button/logic
  -------------------------------------------------------*/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    //email or password not entered
    if (!email.trim()) return setErrorMsg(AlertHelper.EMAIL_ERROR);
    if (!password.trim()) return setErrorMsg(AlertHelper.PASSWORD_ERROR);

    //api call to auth/login
    try {
      const response = await fetch(`${API_URL}/v1/auth/login`, {
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
      
      const data = await response.json();

      //login failed
      //get err msg from backend and display it
      if (!response.ok) {
        return setErrorMsg(data?.message);
      }


      //save user and access_token to local storage
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      //check if role of user while login matches with the backend role
      //prevents users to login from volunteer screen with organizer credentials
      //and vice versa
      const desiredRole = (role ?? "")
      const backendRole = (data?.user?.role ?? "")
      if(desiredRole && backendRole && desiredRole !== backendRole){
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setErrorMsg(AlertHelper.LOG_IN_ERROR);
        return;
      }

      // Route strictly by backend role
      // send the role to the next page with state
      if (backendRole === RoleHelper.ORG_ROLE) {
        navigate("/Homepage-Organizer", { state: { role } });
      } 
      else if (backendRole === RoleHelper.VOL_ROLE) {
        navigate("/Dashboard", { state: { role } });
      } 
      else {  // Unknown role: send them back or show a safe default
        setErrorMsg(AlertHelper.LOG_IN_ERROR);
      }

    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg(AlertHelper.SERVER_ERROR);
    }
  }; //log in logic ends


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
