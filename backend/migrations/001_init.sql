-- Initial migration for HiveHand application
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  username    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Refresh tokens table (session-like)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  jti         UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ DEFAULT NULL,
  replaced_by UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- events table
CREATE TABLE IF NOT EXISTS events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- or uuid_generate_v4()
  organizer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_name       TEXT NOT NULL,
  description    TEXT NOT NULL,
  start_time     TIMESTAMP NOT NULL,
  end_time       TIMESTAMP NOT NULL,
  location       TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_start_before_end CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS ix_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS ix_refresh_expires ON refresh_tokens(expires_at);