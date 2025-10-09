import React, { useState } from "react";
import {Link} from "react-router-dom";
import "./login.css";

type UserRole = "Organizer" | "Volunteer" | "Guest" | "";

const Login: React.FC = () => {
  const [role, setRole] = useState<UserRole>("");

  const handleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    // alert(`You selected: ${selectedRole}`); // Replace this with navigation logic later
  };

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

        { role === "Organizer"  &&(
            <>
                <h2 className="title">Organizer portal</h2>
                <p className="subtitle">Manage your events and volunteers</p>
                <div className="options">
                
                <Link to="/Organizer-signup" className="option-btn">
                 Sign-up
                </Link>

                <button
                    className = "option-btn">Log-in
                </button>
                <button
                    className = "guest-btn"
                    onClick={() => setRole("")}>
                    Back
                </button>
                </div>
            </>
        )}

        { role === "Volunteer"  &&(
            <>
                <h2 className="title">Volunteer portal</h2>
                <p className="subtitle">Join and contribute to causes</p>
                <div className="options">
                <button
                    className = "option-btn">Sign-up
                </button>
                <button
                    className = "option-btn">Log-in
                </button>
                <button
                    className = "guest-btn"
                    onClick={() => setRole("")}>
                    Back
                </button>
                </div>
            </>
        )}
        </div>
    </div>
  );
};

export default Login;
