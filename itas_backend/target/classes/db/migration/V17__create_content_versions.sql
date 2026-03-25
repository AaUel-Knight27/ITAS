CREATE TABLE IF NOT EXISTS content_versions (
    id BIGSERIAL PRIMARY KEY,
    lecture_id BIGINT REFERENCES lectures(id)
        ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    change_notes TEXT,
    uploaded_by BIGINT REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_versions_lecture_id
    ON content_versions(lecture_id);
