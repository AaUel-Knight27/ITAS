ALTER TABLE video_progress
    ADD COLUMN IF NOT EXISTS last_watched_at_display VARCHAR(10);

ALTER TABLE video_progress
    ALTER COLUMN completion_percentage TYPE INTEGER
    USING ROUND(COALESCE(completion_percentage, 0))::INTEGER;
