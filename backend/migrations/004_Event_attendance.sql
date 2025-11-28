CREATE TABLE IF NOT EXISTS event_attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  action        text NOT NULL CHECK (action IN ('sign_in','sign_out')),
  at_time       timestamptz NOT NULL DEFAULT now(),
  location      geometry(MultiPolygon, 3857),         -- reported GPS
  accuracy_m    integer,                        -- optional from device
  accepted      boolean NOT NULL,               -- passed geofence checks
  UNIQUE (event_id, user_id, action, at_time)   -- or a smarter key if needed
);

CREATE INDEX idx_attendance_event ON event_attendance(event_id);
CREATE INDEX idx_attendance_user  ON event_attendance(user_id);
