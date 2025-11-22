import React, { useEffect, useState } from "react";
//import "./authChoice.css";// Reuse same styling
import "./css/Dashboard.css";
import "./css/HomepageOrganizer.css";
import { useNavigate, useLocation } from "react-router-dom";
import { cleanEvents } from "./helpers/EventHelper";
import { Clock, MapPin } from "lucide-react";
import * as RoleHelper from "./helpers/RoleHelper";

const API_URL = "http://localhost:4000";

type EventPost = {
  id: string;
  jobName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  createdAtDate: string;
  createdAtTime: string;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);

  const location = useLocation();
  const state = location.state as RoleHelper.AuthChoiceState;
  const role = state?.role;

  // Start with dummy placeholder events
  const [events, setEvents] = useState<EventPost[]>([
    { id: "1", jobName: "Beach Cleanup", startDate: "Oct 28, 2025", startTime: "11:00 AM", endDate: "2025-10-20", endTime: "12:00 PM", location: "Grand Beach", description: "cleaning up trash and zebra mussels", createdAtDate: "Oct 22", createdAtTime: "9:00AM" },
    { id: "2", jobName: "Food Drive", startDate: "Oct 28, 2025", startTime: "1:00 PM", endDate: "2025-10-20", endTime: "3:00 PM", location: "City Hall", description: "cleaning up trash and zebra mussels", createdAtDate: "Oct 22", createdAtTime: "9:00AM" },
    { id: "3", jobName: "Tree Planting", startDate: "Oct 28, 2025", startTime: "5:00 PM", endDate: "2025-10-20", endTime: "8:00 PM", location: "Assiniboine Park", description: "cleaning up trash and zebra mussels", createdAtDate: "Oct 22", createdAtTime: "9:00AM" },
  ]);

  // Fetch real events non-blockingly
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      if (u?.username) 
        setUsername(u.username);
    } catch {
        setUsername("");
    }
    
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/events`, {
          method: "GET",
          headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();

        //deletes events which have passed and cleans up the dates and time to be more readable
        const cleanData = cleanEvents(data, false);
        setEvents(cleanData); // Replace dummy with real data
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();

    //clear local state
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    try {
      const response = await fetch(`${API_URL}/v1/auth/logout`, {
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

      if (response.status !== 204) {
        try {
          await response.json();
        } catch (error) {
          console.error("Unexpected JSON package", error);
        }
      }//alert(`Log-out successful! Token: ${data.token}`);

      //log out success
      navigate("/", { replace: true });
      // optionally redirect:
      // window.location.href = "/dashboard";
    } catch (error) {
      console.error("Log-out Error:", error);
      alert("Network error — could not connect to server.");
    }
  };

  const handleSignUp = async (eventId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Your session has expired. Please log in again.");
        navigate("/User-login", { state: { role } });
        return;
      }

      //verify token before sending request off
      //get token by user id

      const response = await fetch(`${API_URL}/v1/events/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: eventId
        })
      });

      if(response.status == 401){
        //login expired 
        alert("Your session has expired. Please log in again.");
        navigate("/User-login", { state: { role } });
        return;
      } 
      else if (response.status == 409){
        alert("User is already registered for an event at this time");
        return;
      }
      else if (!response.ok) {
        const err = await response.text();
        alert(`Registration failed: ${err}`);
        return;
      }

      if (response.status !== 204) {
        try {
          await response.json();
        } catch (error) {
          console.error("Unexpected JSON package", error);
        }
      }

      alert("User has been successfully registered for the event");

    } catch (error) {
      console.error("Registration Error:", error);
      alert("Network error — could not connect to server.");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="navigation-container" style={{ alignItems: "stretch" }}>
        <div className="navigation-box">
          <header className="navigation-header">
            <div>
              <h2 className="title" style={{ margin: 0 }}>
                Welcome to your Dashboard - {username}
              </h2>
              <p className="subtitle" style={{ marginTop: 4, left: 0}}>
                Homepage
              </p>
            </div>
            <div className="button-box" style={{ display: "flex", gap: 8 }}>
              
              <button
                className="option_btn"
                title="Your registered events"
                onClick={() => navigate("/My-Registrations", { state: { role } })}
                style= {{backgroundColor:"green"}}
              >
                My events
              </button>

              <button
                className="option-btn"
                title="Profile & settings"
                onClick={() => navigate("/VolunteerProfile", { state: { role } })}
                style= {{backgroundColor:"green"}}
              >
                Profile
              </button>

              <button 
                className="option_btn"
                title="Log-out"
                onClick={handleLogout}
                style= {{backgroundColor:"green"}}
              >
                Log-out
              </button>
            </div>
          </header>
        </div>
      </div>

      <h2 className="section-title">Available Events</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {events.map((event) => (
          <article className="event-info-box"
            key={event.id}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(10, 10, 10, 0.08)";
            }}
          >
            <header className="event-header">
              <h3 style={{ margin: 0, color: "#2c3e50", wordBreak: "break-word" }}>{event.jobName}</h3>
              <small style={{ color: "#888" }}>
                {event.createdAtDate} {event.createdAtTime}
              </small>
            </header>

            <p style={{ margin: "8px 0 12px", color: "#444", lineHeight: 1.4, wordBreak: "break-word", whiteSpace: "pre-wrap", textAlign: "left" }}>
              {event.description}
            </p>

            <div className="job-start-end-times">
              <div> <Clock size={16} />  <strong>Starts at:</strong> {event.startDate}  {event.startTime} </div>
              <div> <Clock size={16} />  <strong>Ends at:</strong> {event.endDate}  {event.endTime} </div>
              <div> <MapPin size={16}/> <strong style={{ wordBreak: "break-word" }}>Location:</strong> {event.location} </div>
            </div>

            <button
              onClick={() => handleSignUp(event.id)}
              className="option-btn"
              type="button"
              style={{ marginTop:12 }}
            >
            Sign-up
            </button>
        </article>
        ))}   
      </div>
    </div>
  );
};

export default Dashboard;