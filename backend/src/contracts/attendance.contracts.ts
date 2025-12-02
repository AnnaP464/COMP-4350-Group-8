
export type AttendanceAction = "sign_in" | "sign_out";

export type AttendanceRow = {
  id: string;
  event_id: string;
  user_id: string;
  action: AttendanceAction;
  at_time: string;      // timestamptz → ISO string
  accepted: boolean;    // geofence check passed
};

export interface AttendanceRepo {
  insertAction(input: {
    eventId: string;
    userId: string;
    action: AttendanceAction;
    accepted: boolean;
    accuracy_m?: number | null;
    // you *may* also include lon/lat if you wire location column properly
  }): Promise<AttendanceRow>;

  /** Last accepted action for this user/event, or null if none. */
  getLastAcceptedAction(opts: {
    eventId: string;
    userId: string;
  }): Promise<AttendanceRow | null>;

  /** All accepted actions for this event+user, oldest → newest */
  listAcceptedActions(opts: {
    eventId: string;
    userId: string;
  }): Promise<AttendanceRow[]>;
}
