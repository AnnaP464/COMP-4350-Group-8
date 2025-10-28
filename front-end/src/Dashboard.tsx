import React, { useEffect, useState } from "react";
//import "./authChoice.css";// Reuse same styling
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

type EventPost = {
  id: string;
  jobName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
};

function cleanEvents(rawEvents: any) {
  const result = [];
  const timeZone = "America/Winnipeg"
  for (const event of rawEvents) {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if(startTime.getTime() < Date.now()){
      if(endTime.getTime() < Date.now()){
        console.log("This event has already passed")
      } else{
        console.log("This event is already in progress")
      }
    }
    else{
      result.push({
        id: event.id,
        jobName: (event.jobName || "").trim(),
        startDate: startTime.toLocaleDateString("en-CA", {
          timeZone: timeZone, year: "numeric", month: "short", day: "2-digit"
        }),
        endDate: endTime.toLocaleDateString("en-CA", {
          timeZone: timeZone, year: "numeric", month: "short", day: "2-digit"
        }),
        startTime: startTime.toLocaleTimeString("en-CA", {
          timeZone: timeZone, hour: "numeric", minute: "2-digit", hour12: true
        }),
        endTime: endTime.toLocaleTimeString("en-CA", {
          timeZone: timeZone, hour: "numeric", minute: "2-digit", hour12: true
        }),
        location: (event.location || "").trim(),
        description: (event.description || "").trim(),
      });
    }
  }
  return result;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Start with dummy placeholder events
  const [events, setEvents] = useState<EventPost[]>([
    {id: "1", jobName: "Beach Cleanup", startDate:"Oct 28, 2025", startTime: "5:00 PM", endDate:"2025-10-20", endTime: "8:00 PM", location: "Grand Beach", description: "cleaning up trash and zebra mussels", },
  ]);

  // Fetch real events non-blockingly
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:4000/v1/events", {
          method: "GET",
          headers: {"Accept": "application/json"}
        });

        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        
        //deletes events which have passed and cleans up the dates and time to be more readable
        const cleanData = cleanEvents(data);
        console.log(cleanData);
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
    try{
      const token = localStorage.getItem("access_token");
      if(!token){
        alert("Your session has expired. Please log in again.");
        navigate("/User-login?role=Volunteer");
        return;
      }

      //verify token before sending request off
      //get token by user id

      console.log(eventId);

      const response = await fetch("http://localhost:4000/v1/events/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: eventId
        })
      });

      if (!response.ok) {
        const err = await response.text();
        alert(`Registration failed: ${err}`);
        return;
      }

      if(response.status !== 204){
        try{
          const data = await response.json();
        } catch (error){
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
            <h4><strong>Job Name:</strong> {event.jobName}</h4>
            <p><strong>Start Date:</strong> {event.startDate}   <strong>Start Time:</strong> {event.startTime}</p>
            <p><strong>End Date:</strong> {event.endDate}   <strong>End Time:</strong> {event.endTime}</p>
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