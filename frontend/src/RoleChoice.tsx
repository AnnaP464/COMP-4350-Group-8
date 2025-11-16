import React from "react";
import {Link} from "react-router-dom";
import "./css/AuthChoice.css";
import type { UserRole } from "./helpers/RoleHelper";

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">Welcome to HiveHand</h2>
        <p className="subtitle">Log in</p>
        <div className="options">
          <Link 
            to={"/Auth-Choice"}
            className="option-btn"
            state={{ role: "Organizer" as UserRole}}
          >
            Organizer
          </Link>

          <Link 
            to={"/Auth-Choice?role=${encodeURIComponent(role)}"}
            className="option-btn"
            state={{ role: "Volunteer" as UserRole}}
          >
            Volunteer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
