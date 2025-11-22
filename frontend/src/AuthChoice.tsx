import React from "react";
import {Link} from "react-router-dom";
import "./css/AuthChoice.css";
import * as RoleHelper from "./helpers/RoleHelper";

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">Welcome to HiveHand</h2>
        <div className="options">
          <Link 
            to={"/Role-Choice"} 
            className="option-btn"
            state={{ 
              authChoice: RoleHelper.SIGN_UP
            }}
          >
            Sign-up
          </Link>

          <Link 
            to={"/Role-Choice"} 
            className="option-btn"
            state={{ 
              authChoice: RoleHelper.LOG_IN
            }}
          >
            Log-in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
