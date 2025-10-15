import React, { useEffect, useState } from "react";
//import "./authChoice.css";// Reuse same styling
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

interface Event {
  id: number;
  title: string;
  date: string;
  duration: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Start with dummy placeholder events
  const [events, setEvents] = useState<Event[]>([
    { id: 1, title: "Beach Cleanup", date: "2025-10-20", duration: "3 hours" },
    { id: 2, title: "Food Drive", date: "2025-10-22", duration: "5 hours" },
    { id: 3, title: "Tree Planting", date: "2025-11-01", duration: "2 hours" },
  ]);

  // Fetch real events non-blockingly
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:4000/v1/", {
          method: "GET",
          headers: {
            "Content-type": "application/json"
          }
        });

        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();

        setEvents(data); // Replace dummy with real data
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:4000/v1/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const err = await response.text();
        alert(`Log-out failed: ${err}`);
        return;
      }

      if(response.status !== 204){
        try{
          const data = await response.json();
        } catch (error){
          console.error("Unexpected JSON package", error);
        }
      }//alert(`Log-out successful! Token: ${data.token}`);

      navigate("/");
      // optionally redirect:
      // window.location.href = "/dashboard";
    } catch (error) {
      console.error("Log-out Error:", error);
      alert("Network error — could not connect to server.");
    }
  };

  const handleSignUp = async (eventID: number) => {
    alert("Not quite finished yet, check back soon!");
    return;
  };

  return (
    <div className="dashboard-container">
      <h1>Welcome to your Dashboard 🎉</h1>

      <form onSubmit={handleLogout}>
        <button className="option-btn" type="submit">
          Log-out
        </button>
      </form>

      <h2 className="section-title">Available Events</h2>

      <div className="events-container">
        {events.map((event) => (
          <div className="event-box" key={event.id}>
            <h3>{event.title}</h3>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Duration:</strong> {event.duration}</p>
            <button
              onClick={() => handleSignUp(event.id)}
              className="option-btn"
              type="button"
            >
              Sign-up
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;