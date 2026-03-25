CREATE TABLE IF NOT EXISTS notification_campaigns (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    audience_type VARCHAR(100) NOT NULL,
    scheduled_at TIMESTAMP,
    send_now BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_by BIGINT REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id)
        ON DELETE CASCADE,
    campaign_id BIGINT REFERENCES
        notification_campaigns(id)
        ON DELETE CASCADE,
    read_status BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    audience_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
