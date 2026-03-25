CREATE TABLE IF NOT EXISTS help_articles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    page_id VARCHAR(100),
    field_id VARCHAR(100),
    category VARCHAR(100),
    tags VARCHAR(500),
    is_published BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    created_by BIGINT REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_articles_page_id
    ON help_articles(page_id);

CREATE INDEX IF NOT EXISTS idx_help_articles_field_id
    ON help_articles(field_id);
