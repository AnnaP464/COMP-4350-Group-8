
--  Add status + timestamps
ALTER TABLE registered_users
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied','accepted','rejected','withdrawn','cancelled')),
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS applied_at timestamptz NOT NULL DEFAULT now();

--Backfill: rows that already exist were direct-registered → treat as accepted
UPDATE registered_users
SET status = 'accepted',
    decided_at = COALESCE(decided_at, now())
WHERE status = 'applied';  -- this will flip old rows created w/o status

--  Indexes 
CREATE INDEX IF NOT EXISTS idx_reg_users_event ON registered_users(event_id);
CREATE INDEX IF NOT EXISTS idx_reg_users_user ON registered_users(user_id);
CREATE INDEX IF NOT EXISTS idx_reg_users_event_status ON registered_users(event_id, status);
