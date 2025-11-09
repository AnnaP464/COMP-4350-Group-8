-- shared user profile table for Org and Vol
CREATE TABLE IF NOT EXISTS user_profiles(
    user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio             text,
    avatar_url      text,
    phone           text,
    city            text,
    country         text,
    contact_pref    text CHECK (contact_pref IN ('email', 'phone', 'none')),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- multiple social media links for users
CREATE TABLE IF NOT EXISTS social_links(
    id uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform        text NOT NULL,
    handle          text, 
    url             text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_links_user ON social_links(user_id);

