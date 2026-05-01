CREATE SCHEMA IF NOT EXISTS admin_schema;
SET search_path TO admin_schema;

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(100),
    activity_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(200),
    course_name VARCHAR(200),
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_user_id
    ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type
    ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created_at
    ON user_activity_logs(created_at);

CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    system_name VARCHAR(100) NOT NULL,
    sync_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_failed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    triggered_by_username VARCHAR(100),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);
