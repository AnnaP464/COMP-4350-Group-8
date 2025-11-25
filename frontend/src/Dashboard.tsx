import React, { useEffect, useState, useMemo } from "react";
// import "./css/Dashboard.css";
import "./css/Homepage.css";
import "./css/AuthChoice.css";
import "./css/EventList.css";

import { useNavigate, useLocation } from "react-router-dom";
import { cleanEvents } from "./helpers/EventHelper";
import HomepageHeader from "./components/HomepageHeader";
import EventList from "./components/EventList";

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

type AppStatus = "applied" | "accepted" | "rejected";
type AppMap = Record<string, AppStatus>;

const Dashboard: React.FC = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  const role = state?.role;

  const [username, setUsername] = useState<string | null>(null);

  //map of eventId -> status so we can render the correct button state
  const [applications, setApplications] = useState<AppMap>({});
  const [events, setEvents] = useState<EventPost[]>([]);
  
  // Build the two events lists:
  //Accepted List & AppliedOrRejectedList
  const acceptedList = useMemo(
    () =>
      events
        .filter(e => applications[e.id] === "accepted")
        .map(e => ({ ...e, status: "accepted" as const })),
    [events, applications]
  );

  const appliedOrRejectedList = useMemo(
    () =>
      events
        .filter(e => applications[e.id] === "applied" || applications[e.id] === "rejected")
        .map(e => ({ ...e, status: applications[e.id] as "applied" | "rejected" })),
    [events, applications]
  );
 
  /* ---------------------------------------------------------------------------
  Fetch real events + my application statuses non-blockingly
  ------------------------------------------------------------------------------*/
  useEffect(() => {

    //get user from local storage
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      if (u?.username) 
        setUsername(u.username);
    } catch {
        setUsername("");
    }
    
    //fetch events + my application statuses (if logged in)
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


    const fetchMyApplications = async () => {
      const token = localStorage.getItem("access_token");
      
      if (!token){      // not logged in -> no application status to render
        setApplications({});
        return; 
      }

      try {
        const res = await fetch(`${API_URL}/v1/events/me/applications`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          // token invalid/expired: surface it, don't silently ignore
          const err = await res.json().catch(() => ({}));
          alert(err?.message || "Session expired. Please log in again.");
          // optionally navigate to login:
          navigate("/User-login", { state: { role } });
          setApplications({});
          return;
        }

        if (!res.ok) {
          // log or surface error instead of ignoring
          const text = await res.text().catch(() => "");
          console.warn("Failed to fetch my applications:", res.status, text);
          setApplications({});
          return;
        }

        const list: Array<{ event_id: string; eventId?: string; status: AppStatus }> = await res.json();
        console.log("Fetched user applications:", list);
        // normalize (support either event_id from SQL or eventId from mapper)
        const map: AppMap = {};
        for (const row of list) {
          const eid = (row as any).eventId ?? (row as any).event_id;
          if (eid) 
            map[eid] = row.status;
        }
        setApplications(map);
        
      } catch (e) {
        console.warn("Failed to fetch my applications", e);
      }
    };

    fetchEvents();
    fetchMyApplications(); 
  }, []);


  

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();

    //clear local state
    localStorage.removeItem("user");
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

  const handleApply = async (eventId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Your session has expired. Please log in again.");
        navigate("/User-login", { state: { role } });
        return;
      }

      //verify token before sending request off
      //get token by user id

      const response = await fetch(`${API_URL}/v1/events/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: eventId
        })
      });

      //store the applied event in the applied list of applications
      setApplications(prev => ({ ...prev, [eventId]: "applied" }));

      const data = await response.json().catch();

      //login expired
      if(response.status == 401){ 
        alert(data.message);
        navigate("/User-login", { state: { role } });
        return;
      } 
      //Already applied
      else if (response.status == 409){
        alert(data.message);
        setApplications((prev) => ({ ...prev, [eventId]: "applied" }));
        return;
      }
      //Server error
      else if (!response.ok) {
        const err = await response.text();
        alert(`Application failed: ${err}`);
        return;
      }

      if (response.status !== 204) {
        try {
          await response.json();
        } catch (error) {
          console.error("Unexpected JSON package", error);
        }
      }

      //sucess 201
      setApplications((prev) => ({ ...prev, [eventId]: "applied" }));
      alert("Application submitted! An organizer will review it.");

    } catch (error) {
      console.error("Registration Error:", error);
      alert("Network error — could not connect to server.");
    }
  };

  // helper: label + disabled state based on status
  const renderApplyButton = (eventId: string) => {
    const status = applications[eventId];
    if (status === "accepted") {
      return (
        <button className="apply-button accepted" disabled>
          Registered
        </button>
      );
    }
    if (status === "applied") {
      return (
        <button className="apply-button applied" disabled>
          Applied (Pending)
        </button>
      );
    }
    if (status === "rejected") {
      return (
        <button className="option-button rejected" disabled>
          Rejected
        </button>
      );
    }
    // default — can apply
    return (
      <button onClick={() => handleApply(eventId)} className="apply-button apply">
        Apply
      </button>
    );
  };

  return (
    <div className="dashboard-container">

      {/* call components/HomepageHeader to display the header bar */}
      <HomepageHeader
        title={`HiveHand - ${username ?? ""}`}
        subtitle="Dashboard"
        actions={
          <>
            <button
              className="option-btn"
              title="Your registered events"
              onClick={() =>
                navigate("/MyRegisteredEvents", { state: { role, items: acceptedList } })
              }
            >
              My events
            </button>

            <button
              className="option-btn"
              title="My applications"
              onClick={() =>
                navigate("/MyApplications", { state: { role, items: appliedOrRejectedList } })
              }
            >
              My applications
            </button>

            <button
              className="option-btn"
              title="Profile & settings"
              onClick={() => navigate("/VolunteerProfile", { state: { role } })}
            >
              Profile
            </button>

            <button
              className="cancel-btn"
              title="Log-out"
              onClick={handleLogout}
            >
              Log-out
            </button>
          </>
        }
      />

      
      <EventList
        title="Volunteer events"
        events={events}
        emptyMessage="No events available."
        renderActions={(ev) => renderApplyButton(ev.id)}
      />
    </div>
  );
};

export default Dashboard;