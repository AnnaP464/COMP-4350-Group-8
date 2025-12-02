import React, { useState } from "react";
import "./css/AuthChoice.css";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import * as RoleHelper from "./helpers/RoleHelper"
import * as AlertHelper from "./helpers/AlertHelper";
import * as UserService from "./services/UserService";
import {Link} from "react-router-dom";

const SignupUser: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const location = useLocation();
  const state = location.state;
  const role = state?.role;
  const subtitle = RoleHelper.subtitle(role)
  const textFieldDesc = RoleHelper.textFieldDesc(role);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg("");

    if (!username.trim()) return setErrorMsg(AlertHelper.NAME_ERROR);
    if (!email.trim()) return setErrorMsg(AlertHelper.EMAIL_ERROR);
    if (!password.trim()) return setErrorMsg(AlertHelper.PASSWORD_ERROR);
    if (password !== confirmPassword) return setErrorMsg(AlertHelper.CONFIRM_PASSWORD_ERROR);
    try {
      const response = await UserService.register(username, email, password, role);

      //sign up failed
      if (!response.ok) {
        try {
          const errorData = await response.json();
          if(response.status === 409) {
            setErrorMsg(AlertHelper.DUPLICATE_EMAIL_ERROR);
          } else if(Array.isArray(errorData.errors)){
            const msg = errorData.errors.map((e:any) => e.message).join("\n");
            if (msg?.includes("8")) {
              setErrorMsg(AlertHelper.PASSWORD_LENGTH_ERROR);
            } else if(msg?.includes("3") || msg?.includes("32")) {
              setErrorMsg(AlertHelper.NAME_LENGTH_ERROR);
            }
          }
          else if(errorData.message) {
            setErrorMsg(errorData.message);
          }
        }
        catch (error) {
          setErrorMsg(AlertHelper.DUPLICATE_EMAIL_ERROR);
        }
        return;
      }

      await response.json();
      navigate("/User-login", { state: { role } });

    } catch (error) {
      console.error("Sign-up error:", error);
      setErrorMsg(AlertHelper.SERVER_ERROR);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">{role} Sign-up</h2>
        <p className="subtitle">{subtitle}</p>
        {errorMsg && <p className="errorMsg">{errorMsg}</p>}
        <form onSubmit={handleSubmit} className="options" style={{ gap: 10 }}>
          <input
            className="text-input"
            type="text"
            placeholder= {textFieldDesc}
            value={username}
            onChange={(e) => {setErrorMsg(""); 
              setUsername(e.target.value);}}
          />

          <input
            className="text-input"
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => {setErrorMsg("");
              setEmail(e.target.value)}}
          />

          <input
            className="text-input"
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => {setErrorMsg(""); 
              setPassword(e.target.value)}}
          />

          <input
            className="text-input"
            type="password"
            placeholder="Confirm Password *"
            value={confirmPassword}
            onChange={(e) => {setErrorMsg("");
              setConfirmPassword(e.target.value)}}
          />

          <button className="option-btn" type="submit">
            Sign-up
          </button>

          <Link to="/" className="guest-btn" style={{ textAlign: "center" }}>
            Back to Role Selection
          </Link>
        </form>
      </div>
    </div>
  );
};

export default SignupUser;