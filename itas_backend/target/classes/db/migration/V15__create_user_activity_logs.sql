CREATE TABLE IF NOT EXISTS user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id)
        ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    resource_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);
