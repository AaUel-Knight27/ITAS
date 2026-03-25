CREATE TABLE IF NOT EXISTS webinars (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    presenter_id BIGINT REFERENCES users(id)
        ON DELETE SET NULL,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INT,
    max_attendees INT,
    meeting_link VARCHAR(500),
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webinar_registrations (
    id BIGSERIAL PRIMARY KEY,
    webinar_id BIGINT REFERENCES webinars(id)
        ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id)
        ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT NOW(),
    attended BOOLEAN DEFAULT FALSE,
    UNIQUE (webinar_id, user_id)
);
