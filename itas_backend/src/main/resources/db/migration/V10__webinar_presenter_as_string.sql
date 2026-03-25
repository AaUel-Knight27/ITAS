ALTER TABLE webinars
    DROP CONSTRAINT IF EXISTS webinars_presenter_id_fkey;

ALTER TABLE webinars
    ALTER COLUMN presenter_id TYPE VARCHAR(255)
    USING presenter_id::text;

UPDATE webinars w
SET presenter_id = u.username
FROM users u
WHERE w.presenter_id = u.id::text;

UPDATE webinars
SET description = ''
WHERE description IS NULL;

UPDATE webinars
SET presenter_id = 'ITAS'
WHERE presenter_id IS NULL OR BTRIM(presenter_id) = '';

ALTER TABLE webinars
    ALTER COLUMN description SET NOT NULL,
    ALTER COLUMN presenter_id SET NOT NULL;
