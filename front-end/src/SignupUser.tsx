import React, { useState } from "react";
import "./authChoice.css";  // Reuse same styling
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const SignupUser: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  //if required fields empty, then handleSubmit doesn't run
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg("");

    if (!username.trim()) return setErrorMsg("Name is required.");
    if (!email.trim()) return setErrorMsg("Email is required.");
    if (!password.trim()) return setErrorMsg("Password is required.");
    if (password !== confirmPassword) return setErrorMsg("Passwords do not match.");
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
          role,
          // role,: (role ?? "").toLowerCase() === "organizer" ? "organizer"
          //     : (role ?? "").toLowerCase() === "volunteer" ? "volunteer"
          //     : "", // or omit role to trigger backend validation error
        }),
      });

      //sign up failed
      if (!response.ok) 
      {
        let msg;
        try{
          const errorData = await response.json();
          if(response.status === 409)
            setErrorMsg("Email already exists. Try signing in");
          else if(Array.isArray(errorData.errors)){
            msg = errorData.errors.map((e:any) => e.message).join("\n"); //chatgpt
            if (msg?.includes("8"))
              setErrorMsg("Password must be atleast 8 characters");
            else if(msg?.includes("3") || msg?.includes("32"))
              setErrorMsg("Username must be between 3 to 32 characters");
          }
          else if(errorData.message)
            setErrorMsg(errorData.message);
        }
        catch{
          setErrorMsg("Unexpected error from server");
          console.log("Error from server");
        }
        return;
      }

      const data = await response.json();
      navigate(`/User-login?role=${role}`);

    } catch (error) {
      console.error("Sign-up error:", error);
      setErrorMsg(`${error}`);
      alert("Network error — could not connect to server." + error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">{role} Sign-up</h2>
        <p className="subtitle">{subtitle}</p>

        {/* only redner when there is sign-up error */}
        {errorMsg && <p className="errorMsg">{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="options" style={{ gap: 10 }}>
          <input
            className="text-input"
            type="text"
            placeholder= {textFieldDesc}
            value={username}
            onChange={(e) => {setErrorMsg(""); 
              setUsername(e.target.value);}}
            required
          />
          <input
            className="text-input"
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => {setErrorMsg("");
              setEmail(e.target.value)}}
            required
          />
          <input
            className="text-input"
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => {setErrorMsg(""); 
              setPassword(e.target.value)}}
            required
          />
          <input
            className="text-input"
            type="password"
            placeholder="Confirm Password *"
            value={confirmPassword}
            onChange={(e) => {setErrorMsg("");
              setConfirmPassword(e.target.value)}}
            required
          />

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