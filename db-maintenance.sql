-- Analyze all tables for query planner
ANALYZE;

-- Vacuum all tables to reclaim space
VACUUM ANALYZE;

-- Verify all schemas exist
SELECT schema_name FROM information_schema.schemata
WHERE schema_name IN (
  'auth_schema', 'course_schema', 'learning_schema',
  'webinar_schema', 'notify_schema', 'admin_schema'
);

-- Verify all key indexes exist
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname IN (
  'auth_schema', 'course_schema', 'learning_schema'
)
ORDER BY schemaname, tablename;

-- Check table row counts (sanity check)
SELECT
  'auth_schema.users' as tbl,
  count(*) as rows
FROM auth_schema.users
UNION ALL
SELECT 'course_schema.courses', count(*)
FROM course_schema.courses
UNION ALL
SELECT 'learning_schema.course_enrollments', count(*)
FROM learning_schema.course_enrollments;
