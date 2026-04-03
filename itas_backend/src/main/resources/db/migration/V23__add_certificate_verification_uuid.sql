-- Add UUID column for public verification
ALTER TABLE certificates
    ADD COLUMN IF NOT EXISTS
    verification_uuid VARCHAR(36) UNIQUE;

-- Generate UUIDs for existing certificates
UPDATE certificates
    SET verification_uuid = gen_random_uuid()::text
    WHERE verification_uuid IS NULL;

-- Make NOT NULL after populating
ALTER TABLE certificates
    ALTER COLUMN verification_uuid
    SET NOT NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS
    idx_certificate_uuid
    ON certificates(verification_uuid);
