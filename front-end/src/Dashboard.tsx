import React from "react";
import "./authChoice.css";  // Reuse same styling

const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome to your Dashboard 🎉</h1>
      <p>You’re now logged in.</p>
      <div style={{ marginTop: "2rem" }}>
        <button>
            View Profile
        </button>
        <button style={{ marginLeft: "1rem" }}>
            Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;