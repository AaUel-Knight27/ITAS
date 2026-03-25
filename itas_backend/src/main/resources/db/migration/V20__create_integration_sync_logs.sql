CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    system_name VARCHAR(100) NOT NULL,
    sync_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    records_processed INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message TEXT,
    triggered_by BIGINT REFERENCES users(id)
        ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    duration_ms BIGINT
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_system_name
    ON integration_sync_logs(system_name);

CREATE INDEX IF NOT EXISTS idx_sync_logs_status
    ON integration_sync_logs(status);

CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at
    ON integration_sync_logs(started_at DESC);
