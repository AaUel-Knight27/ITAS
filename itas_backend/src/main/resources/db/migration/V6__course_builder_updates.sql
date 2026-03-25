ALTER TABLE lectures
    ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE assessments
    ADD COLUMN IF NOT EXISTS lecture_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_assessment_lecture'
    ) THEN
        ALTER TABLE assessments
            ADD CONSTRAINT fk_assessment_lecture
                FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE SET NULL;
    END IF;
END $$;
