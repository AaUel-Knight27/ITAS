SET search_path TO webinar_schema;

INSERT INTO webinar_schema.webinars (
    id,
    title,
    description,
    scheduled_at,
    duration_minutes,
    meeting_link,
    presenter_name,
    max_attendees,
    status,
    created_by,
    created_at
)
SELECT
    1,
    'ITAS Platform Orientation',
    'A starter webinar for validating the microservice migration and onboarding learners.',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    60,
    'https://meet.itas.local/orientation',
    'ITAS Training Team',
    250,
    'SCHEDULED',
    'system',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM webinar_schema.webinars
    WHERE id = 1
);

SELECT setval(
    'webinar_schema.webinars_id_seq',
    COALESCE((SELECT MAX(id) FROM webinar_schema.webinars), 1),
    true
);

SELECT setval(
    'webinar_schema.webinar_registrations_id_seq',
    COALESCE((SELECT MAX(id) FROM webinar_schema.webinar_registrations), 1),
    true
);
