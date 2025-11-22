
-- Registered Users table
CREATE TABLE IF NOT EXISTS registered_users(
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id  UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);