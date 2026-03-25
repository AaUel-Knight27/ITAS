ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS status
    VARCHAR(50) DEFAULT 'DRAFT';

UPDATE courses
SET status = CASE
    WHEN published = true THEN 'PUBLISHED'
    ELSE 'DRAFT'
END
WHERE status IS NULL
   OR status = 'DRAFT';

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS archived_at
    TIMESTAMP;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS archived_by
    BIGINT REFERENCES users(id)
        ON DELETE SET NULL;
