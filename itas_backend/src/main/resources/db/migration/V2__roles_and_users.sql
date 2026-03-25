-- Default password Password@123

INSERT INTO roles (name, description) VALUES
    ('TAXPAYER', 'Regular taxpayer user'),
    ('TAX_AGENT', 'Licensed tax agent'),
    ('MOR_STAFF', 'Ministry of Revenue staff'),
    ('CONTENT_ADMIN', 'Manages content library'),
    ('TRAINING_ADMIN', 'Manages training programs'),
    ('COMMUNICATION', 'Communication officer'),
    ('MANAGER', 'Analytics and reporting access'),
    ('WEB_ADMIN', 'System and web administrator')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, status, created_at, updated_at) VALUES
('Taxpayer', 'taxpayer@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Taxpayer', 'User', (SELECT id FROM roles WHERE name='TAXPAYER'), 'ACTIVE', NOW(), NOW()),
('Taxagent', 'taxagent@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Tax', 'Agent', (SELECT id FROM roles WHERE name='TAX_AGENT'), 'ACTIVE', NOW(), NOW()),
('MoR Staff', 'officeworker@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Office', 'Worker', (SELECT id FROM roles WHERE name='MOR_STAFF'), 'ACTIVE', NOW(), NOW()),
('Content Admin', 'contentadmin@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Content', 'Admin', (SELECT id FROM roles WHERE name='CONTENT_ADMIN'), 'ACTIVE', NOW(), NOW()),
('Training Admin', 'trainingadmin@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Training', 'Administrator', (SELECT id FROM roles WHERE name='TRAINING_ADMIN'), 'ACTIVE', NOW(), NOW()),
('Communication Officer', 'communicationofficer@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Communication', 'Officer', (SELECT id FROM roles WHERE name='COMMUNICATION'), 'ACTIVE', NOW(), NOW()),
('Manager', 'manager@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Manager', 'User', (SELECT id FROM roles WHERE name='MANAGER'), 'ACTIVE', NOW(), NOW()),
('Web Admin', 'webadministrator@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Web', 'Administrator', (SELECT id FROM roles WHERE name='WEB_ADMIN'), 'ACTIVE', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role_id = EXCLUDED.role_id,
    status = EXCLUDED.status,
    updated_at = NOW();
