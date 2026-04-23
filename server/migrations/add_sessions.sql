-- Table de sessions pour révocation individuelle
-- Chaque login crée une session, chaque logout la révoque
-- Reset password révoque TOUTES les sessions d'un utilisateur

CREATE TABLE IF NOT EXISTS sessions (
    id          VARCHAR(64) PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at ON sessions (revoked_at);
