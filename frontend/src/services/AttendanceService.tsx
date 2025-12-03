// src/services/AttendanceService.tsx
import apiFetch from "../api/ApiFetch";
import { cleanEvents, type CleanEvent } from "../helpers/EventHelper";

export type RecentActivityItem = {
  id: string;
  title: string;
  date: string;
  hours: number;
  where: string;
};

export type VolunteerStats = {
  totalHours: number;           // summed hours across all completed events
  jobsCompleted: number;        // number of completed events with >0 minutes
  upcomingJobs: number;         // accepted events in the future
  recentActivity: RecentActivityItem[]; // last 3 completed events
};

type ApplicationStatus = "applied" | "accepted" | "rejected" | "withdrawn";

type ApplicationRow = {
  event_id?: string;
  eventId?: string;
  status: ApplicationStatus;
};

type AttendanceStatusView = {
  status: {
    isSignedIn: boolean;
    totalMinutes: number;
  };
  rules: {
    canSignIn: boolean;
    canSignOut: boolean;
    reason?: string;
  };
};

/**
 * Aggregates volunteer stats from:
 *  - /v1/events (public events)
 *  - /v1/events/me/applications (to see which ones are accepted)
 *  - /v1/events/:id/attendance/status (minutes tracked per event)
 */
export async function fetchVolunteerStats(): Promise<VolunteerStats> {
  try {
    // 1) All events (public feed, same as Dashboard)
    const eventsRes = await apiFetch("/v1/events", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!eventsRes.ok) {
      throw new Error("Failed to fetch events");
    }

    const rawEvents = await eventsRes.json();
    const events = cleanEvents(rawEvents, false) as CleanEvent[];

    // 2) My applications: know which events I'm accepted for
    const appsRes = await apiFetch("/v1/events/me/applications", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!appsRes.ok) {
      throw new Error("Failed to fetch applications");
    }

    const apps: ApplicationRow[] = await appsRes.json();
    const statusMap: Record<string, ApplicationStatus> = {};
    for (const row of apps) {
      const id = row.eventId ?? row.event_id;
      if (id) statusMap[id] = row.status;
    }

    const acceptedEvents = events.filter(
      (ev) => statusMap[ev.id] === "accepted"
    );

    // 3) Attendance status for each accepted event
    const attendanceList: (AttendanceStatusView | null)[] = await Promise.all(
      acceptedEvents.map(async (ev) => {
        try {
          const res = await apiFetch(
            `/v1/events/${ev.id}/attendance/status`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
            }
          );
          if (!res.ok) return null;
          return (await res.json()) as AttendanceStatusView;
        } catch {
          return null;
        }
      })
    );

    const now = Date.now();
    let totalMinutes = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    const completedActivities: { ev: CleanEvent; minutes: number }[] = [];

    acceptedEvents.forEach((ev, idx) => {
      const attendance = attendanceList[idx];
      const minutes = attendance?.status.totalMinutes ?? 0;
      totalMinutes += minutes;

      const endTs = (ev as any).endTimestamp as number | undefined;
      const startTs = (ev as any).startTimestamp as number | undefined;

      if (typeof startTs === "number" && startTs > now) {
        // future event
        upcomingCount += 1;
      } else if (typeof endTs === "number" && endTs <= now && minutes > 0) {
        // past event with some time tracked → completed job
        completedCount += 1;
        completedActivities.push({ ev, minutes });
      }
    });

    // Sort completed by end time (most recent first)
    completedActivities.sort((a, b) => {
      const aEnd = (a.ev as any).endTimestamp ?? 0;
      const bEnd = (b.ev as any).endTimestamp ?? 0;
      return bEnd - aEnd;
    });

    // Take last 3 completed events as "recent activity"
    const recentActivity = completedActivities.slice(0, 3).map(({ ev, minutes }) => {
      const endTs = (ev as any).endTimestamp as number | undefined;
      const date = endTs
        ? new Date(endTs).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "";

      return {
        id: ev.id,
        title: (ev as any).jobName ?? "Event",
        date,
        hours: +(minutes / 60).toFixed(1), // convert minutes → hours (1 decimal)
        where: (ev as any).location ?? "",
      };
    });

    const totalHours = +(totalMinutes / 60).toFixed(1);

    return {
      totalHours,
      jobsCompleted: completedCount,
      upcomingJobs: upcomingCount,
      recentActivity,
    };
  } catch (err) {
    console.error("fetchVolunteerStats error", err);
    // Fail soft: return zeros instead of breaking the profile page
    return {
      totalHours: 0,
      jobsCompleted: 0,
      upcomingJobs: 0,
      recentActivity: [],
    };
  }
}
