-- Remove the user_notifications table.
-- In-app notifications are replaced by email delivery.
-- notification_campaigns is kept for campaign history and audit trail.

DROP TABLE IF EXISTS user_notifications CASCADE;
