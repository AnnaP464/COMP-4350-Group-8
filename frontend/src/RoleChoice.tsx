import React from "react";
import {Link} from "react-router-dom";
import "./css/AuthChoice.css";
import * as RoleHelper from "./helpers/RoleHelper";
import { useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const location = useLocation();
  const state = location.state
  const authChoice = state?.authChoice;
  const authPath = RoleHelper.getAuthPath(authChoice);

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">Welcome to HiveHand</h2>
        <p className="subtitle">{authChoice}</p>
        <div className="options">
          <Link 
            to={authPath}
            className="option-btn"
            state={{ 
              role: RoleHelper.ORG_ROLE,
              authChoice: authChoice
            }}
          >
            Organizer
          </Link>

          <Link 
            to={authPath}
            className="option-btn"
            state={{ 
              role: RoleHelper.VOL_ROLE,
              authChoice: authChoice
            }}
          >
            Volunteer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
