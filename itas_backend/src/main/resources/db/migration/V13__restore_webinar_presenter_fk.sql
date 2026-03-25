ALTER TABLE webinars
    DROP CONSTRAINT IF EXISTS webinars_presenter_id_fkey;

ALTER TABLE webinars
    ALTER COLUMN description DROP NOT NULL;

ALTER TABLE webinars
    ALTER COLUMN presenter_id DROP NOT NULL;

ALTER TABLE webinars
    ADD COLUMN presenter_id_new BIGINT;

UPDATE webinars w
SET presenter_id_new = u.id
FROM users u
WHERE u.username = w.presenter_id;

ALTER TABLE webinars
    DROP COLUMN presenter_id;

ALTER TABLE webinars
    RENAME COLUMN presenter_id_new TO presenter_id;

ALTER TABLE webinars
    ADD CONSTRAINT webinars_presenter_id_fkey
    FOREIGN KEY (presenter_id) REFERENCES users(id)
    ON DELETE SET NULL;
