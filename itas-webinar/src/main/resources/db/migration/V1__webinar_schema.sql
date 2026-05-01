CREATE SCHEMA IF NOT EXISTS webinar_schema;
SET search_path TO webinar_schema;

CREATE TABLE IF NOT EXISTS webinars (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    meeting_link VARCHAR(500),
    presenter_name VARCHAR(200),
    max_attendees INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webinar_registrations (
    id BIGSERIAL PRIMARY KEY,
    webinar_id BIGINT NOT NULL
        REFERENCES webinars(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    user_email VARCHAR(200),
    user_name VARCHAR(200),
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_reg_webinar_user UNIQUE (webinar_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_webinar_id
    ON webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_reg_user_id
    ON webinar_registrations(user_id);
