import React from "react";
import {Link} from "react-router-dom";
import "./css/AuthChoice.css";
import * as RoleHelper from "./helpers/RoleHelper";
import { useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const location = useLocation();
  const state = location.state as RoleHelper.AuthChoiceState;
  const role = state?.role;
  const subtitle = RoleHelper.subtitle(role)
  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">{role} Portal</h2>
        <p className="subtitle">{subtitle}</p>
        <div className="options">
          <Link 
            to={"/User-signup"} 
            className="option-btn"
            state={{ role : role }}
          >
            Sign-up
          </Link>

          <Link 
            to={"/User-login"} 
            className="option-btn"
            state={{ role : role }}
          >
            Log-in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
