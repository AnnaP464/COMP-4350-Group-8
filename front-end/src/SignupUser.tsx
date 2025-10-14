import React, { useState } from "react";
import "./authChoice.css";  // Reuse same styling
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const SignupUser: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [phone, setPhone] = useState("");
  // const [city, setCity] = useState("");
  // const [skills, setSkills] = useState("");
  //const [agree, setAgree] = useState(false);

  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const role = queryParams.get("role");
  const navigate = useNavigate();

  let textFieldDesc = "";
  let subtitle = "";
  if(role === "Organizer"){
    textFieldDesc = "Organization name *";
    subtitle = "Manage your events and volunteers";
  } else if(role === "Volunteer"){
    textFieldDesc = "Your username *";
    subtitle = "Join and contribute to causes";
  } else {
    textFieldDesc = "This text should not appear"
    subtitle = "This text should not appear";
  }

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) return alert("Name is required.");
    if (!email.trim()) return alert("Email is required.");
    if (!password.trim()) return alert("Password is required.");
    if (password !== confirmPassword) return alert("Passwords do not match.");
    // if (!agree) return alert("Please agree to the terms.");
    
    /*
    alert(
        `Organizer signup:\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n`
        // `Phone: ${phone}\n` +
        // `City: ${city}\n` +
        // `Skills: ${skills}`
    );

    // Reset fields after submit
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    // setPhone("");
    // setCity("");
    // setSkills("");
    // setAgree(false);
    */
    try {
      const response = await fetch("http://localhost:4000/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role, // send role too if your backend expects it
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        alert(`Sign-up failed: ${err}`);
        return;
      }

      const data = await response.json();
      //alert(JSON.stringify(data)); //too much data
      //alert(`Sign-up successful! Token: ${data.token}`);

      navigate("/User-login");

      // optionally redirect:
      // window.location.href = "/dashboard";
    } catch (error) {
      console.error("Sign-up error:", error);
      alert("Network error — could not connect to server." + error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">{role} Sign-up</h2>
        <p className="subtitle">{subtitle}</p>

        <form onSubmit={handleSubmit} className="options" style={{ gap: 10 }}>
          <input
            className="text-input"
            type="text"
            placeholder= {textFieldDesc}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
          <input
            className="text-input"
            type="password"
            placeholder="Confirm Password *"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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

export default SignupUser;