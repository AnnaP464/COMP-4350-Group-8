
export type AttendanceState =
  | "none"          // not clocked in, not allowed yet
  | "too-early"     // before clock-in window
  | "not-in-fence"  // button disabled because location outside
  | "can-clock-in"  // inside fence, within time window
  | "clocked-in"    // currently clocked in
  | "event-ended";  // no more clockins

// can extend later with server info, timestamps, etc
