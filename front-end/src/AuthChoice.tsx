import React, { useState } from "react";
import {Link} from "react-router-dom";
import "./AuthChoice.css";

type UserRole = "Organizer" | "Volunteer" | "Guest" | "";

const Login: React.FC = () => {
  const [role, setRole] = useState<UserRole>("");

  const handleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    // alert(`You selected: ${selectedRole}`); // Replace this with navigation logic later
  };

  let subtitle = "";
  if(role === "Organizer"){
    subtitle = "Manage your events and volunteers";
  } else if(role === "Volunteer"){
    subtitle = "Join and contribute to causes";
  } else if(role === "Guest"){
    subtitle = "Come check us out"
  }

  return (
    <div className="login-container">
      <div className="login-box">

        {role === "" && (
            <>
                <h2 className="title">Welcome to HiveHand</h2>
                <p className="subtitle">Log in or continue as a guest</p>

                <div className="options">
                    <button
                        className="option-btn"
                        onClick={() => handleSelect("Organizer")}
                    >
                        Organizer
                    </button>

                    <button
                        className="option-btn"
                        onClick={() => handleSelect("Volunteer")}
                    >
                        Volunteer
                    </button>

                    <button
                        className="guest-btn"
                        onClick={() => handleSelect("Guest")}
                    >
                        Continue as Guest
                    </button>
                </div>
            </>
        )}

        { (role === "Volunteer" || role === "Organizer")  && (
            <>
                <h2 className="title">{role} Portal</h2>
                <p className="subtitle">{subtitle}</p>
                <div className="options">

                <Link to={`/User-signup?role=${encodeURIComponent(role)}`} className="option-btn">
                    Sign-up
                </Link>

                <Link to={`/User-login?role=${encodeURIComponent(role)}`} className="option-btn">
                    Log-in
                </Link>
                <button
                    className = "guest-btn"
                    onClick={() => setRole("")}>
                    Back to Role Selection
                </button>
                </div>
            </>
        )}

        { (role === "Guest")  && (
            <>
                <h2 className="title">{role} Portal</h2>
                <p className="subtitle">{subtitle}</p>
                <div className="options">

                <Link to={""} className="option-btn">
                    Proceed
                </Link>
                <button
                    className = "guest-btn"
                    onClick={() => setRole("")}>
                    Back to Role Selection
                </button>
                </div>
            </>
        )}
        </div>
    </div>
  );
};

export default Login;
