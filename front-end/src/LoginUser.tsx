import React, { useState } from "react";
import "./authChoice.css";  // Reuse same styling
import { useLocation } from "react-router-dom";

const LoginUser: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [phone, setPhone] = useState("");
  // const [city, setCity] = useState("");
  // const [skills, setSkills] = useState("");
  //const [agree, setAgree] = useState(false);

  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const role = queryParams.get("role");

  let subtitle = "";
  if(role === "Organizer"){
    subtitle = "Manage your events and volunteers";
  } else if(role === "Volunteer"){
    subtitle = "Join and contribute to causes";
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return alert("Email is required.");
    if (!password.trim()) return alert("Password is required.");
    // if (!agree) return alert("Please agree to the terms.");

    alert(
        `Organizer signup:\n` +
        //`Name: ${name}\n` +
        `Email: ${email}\n` //+
        // `Phone: ${phone}\n` +
        // `City: ${city}\n` +
        // `Skills: ${skills}`
    );

    // Reset fields after submit
    setEmail("");
    setPassword("");
    // setPhone("");
    // setCity("");
    // setSkills("");
    // setAgree(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">{role} Log-in</h2>
        <p className="subtitle">{subtitle}</p>

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
          {/* <input
            className="text-input"
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="text-input"
            type="text"
            placeholder="City / Location"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <textarea
            className="text-input"
            placeholder="Skills or Interests (optional)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            rows={3}
          /> */}

          {/* <label className="checkbox-row">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span style={{ marginLeft: 8 }}>
              I agree to the Terms & Privacy Policy *
            </span>
          </label> */}

          <button className="option-btn" type="submit">
            Sign-up
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