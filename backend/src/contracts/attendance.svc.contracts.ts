// src/contracts/attendance.svc.contracts.ts
import type { AttendanceAction } from "./attendance.contracts";

export type AttendanceStatus = "clocked-in" | "clocked-out";

export type AttendanceInput = {
  eventId: string;
  userId: string;
  lon: number;
  lat: number;
  accuracy_m?: number | null;
};

export type AttendanceResult = {
  status: AttendanceStatus;  // after this action
  accepted: boolean;         // geofence passed?
  reason?: string;           // extra info when not accepted
};

export interface AttendanceService {
  signIn(input: AttendanceInput): Promise<AttendanceResult>;
  signOut(input: AttendanceInput): Promise<AttendanceResult>;
  getStatus(input: { eventId: string; userId: string }): Promise<{
    status: AttendanceStatus;
  }>;
}
