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
('alex', 'alex01@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Alex', 'Meyer', (SELECT id FROM roles WHERE name='TAXPAYER'), 'ACTIVE', NOW(), NOW()),
('sarah', 'sara02@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Sara', 'Klein', (SELECT id FROM roles WHERE name='TAXPAYER'), 'ACTIVE', NOW(), NOW()),
('john', 'john03@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'John', 'Smith', (SELECT id FROM roles WHERE name='TAXPAYER'), 'ACTIVE', NOW(), NOW()),
('lina', 'lina04@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Lina', 'Verhoeven', (SELECT id FROM roles WHERE name='TAXPAYER'), 'ACTIVE', NOW(), NOW()),
('omar', 'omar05@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Omar', 'Haddad', (SELECT id FROM roles WHERE name='TAXPAYER'), 'ACTIVE', NOW(), NOW()),

('mike', 'mike.agent@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Mike', 'Johnson', (SELECT id FROM roles WHERE name='TAX_AGENT'), 'ACTIVE', NOW(), NOW()),
('emma', 'emma.agent@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Emma', 'Brown', (SELECT id FROM roles WHERE name='TAX_AGENT'), 'ACTIVE', NOW(), NOW()),
('david', 'david.agent@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'David', 'Wilson', (SELECT id FROM roles WHERE name='TAX_AGENT'), 'ACTIVE', NOW(), NOW()),
('nina', 'nina.agent@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Nina', 'Petrova', (SELECT id FROM roles WHERE name='TAX_AGENT'), 'ACTIVE', NOW(), NOW()),
('li', 'li.agent@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Li', 'Wei', (SELECT id FROM roles WHERE name='TAX_AGENT'), 'ACTIVE', NOW(), NOW()),

('anna', 'anna.staff@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Anna', 'Jansen', (SELECT id FROM roles WHERE name='MOR_STAFF'), 'ACTIVE', NOW(), NOW()),
('paul', 'paul.staff@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Paul', 'Bakker', (SELECT id FROM roles WHERE name='MOR_STAFF'), 'ACTIVE', NOW(), NOW()),
('rita', 'rita.staff@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Rita', 'Singh', (SELECT id FROM roles WHERE name='MOR_STAFF'), 'ACTIVE', NOW(), NOW()),
('khalid', 'khalid.staff@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Khalid', 'Ali', (SELECT id FROM roles WHERE name='MOR_STAFF'), 'ACTIVE', NOW(), NOW()),
('zoe', 'zoe.staff@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Zoe', 'Dubois', (SELECT id FROM roles WHERE name='MOR_STAFF'), 'ACTIVE', NOW(), NOW()),

('lucas', 'lucas.content@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Lucas', 'Garcia', (SELECT id FROM roles WHERE name='CONTENT_ADMIN'), 'ACTIVE', NOW(), NOW()),
('mia', 'mia.content@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Mia', 'Rossi', (SELECT id FROM roles WHERE name='CONTENT_ADMIN'), 'ACTIVE', NOW(), NOW()),
('noah', 'noah.content@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Noah', 'Schmidt', (SELECT id FROM roles WHERE name='CONTENT_ADMIN'), 'ACTIVE', NOW(), NOW()),
('ella', 'ella.content@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Ella', 'Nguyen', (SELECT id FROM roles WHERE name='CONTENT_ADMIN'), 'ACTIVE', NOW(), NOW()),
('ivan', 'ivan.content@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Ivan', 'Kovacs', (SELECT id FROM roles WHERE name='CONTENT_ADMIN'), 'ACTIVE', NOW(), NOW()),

('sam', 'sam.training@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Sam', 'Taylor', (SELECT id FROM roles WHERE name='TRAINING_ADMIN'), 'ACTIVE', NOW(), NOW()),
('olga', 'olga.training@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Olga', 'Ivanova', (SELECT id FROM roles WHERE name='TRAINING_ADMIN'), 'ACTIVE', NOW(), NOW()),
('lee', 'lee.training@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Lee', 'Chen', (SELECT id FROM roles WHERE name='TRAINING_ADMIN'), 'ACTIVE', NOW(), NOW()),
('julia', 'julia.training@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Julia', 'Silva', (SELECT id FROM roles WHERE name='TRAINING_ADMIN'), 'ACTIVE', NOW(), NOW()),
('mark', 'mark.training@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Mark', 'Evans', (SELECT id FROM roles WHERE name='TRAINING_ADMIN'), 'ACTIVE', NOW(), NOW()),

('adam', 'adam.comm@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Adam', 'White', (SELECT id FROM roles WHERE name='COMMUNICATION'), 'ACTIVE', NOW(), NOW()),
('sophia', 'sophia.comm@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Sophia', 'Lopez', (SELECT id FROM roles WHERE name='COMMUNICATION'), 'ACTIVE', NOW(), NOW()),
('tariq', 'tariq.comm@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Tariq', 'Rahman', (SELECT id FROM roles WHERE name='COMMUNICATION'), 'ACTIVE', NOW(), NOW()),
('lucy', 'lucy.comm@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Lucy', 'Hill', (SELECT id FROM roles WHERE name='COMMUNICATION'), 'ACTIVE', NOW(), NOW()),
('ken', 'ken.comm@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Ken', 'Yamamoto', (SELECT id FROM roles WHERE name='COMMUNICATION'), 'ACTIVE', NOW(), NOW()),

('ryan', 'ryan.manager@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Ryan', 'Cooper', (SELECT id FROM roles WHERE name='MANAGER'), 'ACTIVE', NOW(), NOW()),
('claire', 'claire.manager@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Claire', 'Martin', (SELECT id FROM roles WHERE name='MANAGER'), 'ACTIVE', NOW(), NOW()),
('hassan', 'hassan.manager@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Hassan', 'Khan', (SELECT id FROM roles WHERE name='MANAGER'), 'ACTIVE', NOW(), NOW()),
('emil', 'emil.manager@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Emil', 'Andersson', (SELECT id FROM roles WHERE name='MANAGER'), 'ACTIVE', NOW(), NOW()),
('nora', 'nora.manager@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Nora', 'Ibrahim', (SELECT id FROM roles WHERE name='MANAGER'), 'ACTIVE', NOW(), NOW()),

('daniel', 'daniel.web@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Daniel', 'Moore', (SELECT id FROM roles WHERE name='WEB_ADMIN'), 'ACTIVE', NOW(), NOW()),
('amy', 'amy.web@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Amy', 'Clark', (SELECT id FROM roles WHERE name='WEB_ADMIN'), 'ACTIVE', NOW(), NOW()),
('raj', 'raj.web@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Raj', 'Patel', (SELECT id FROM roles WHERE name='WEB_ADMIN'), 'ACTIVE', NOW(), NOW()),
('oliver', 'oliver.web@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Oliver', 'King', (SELECT id FROM roles WHERE name='WEB_ADMIN'), 'ACTIVE', NOW(), NOW()),
('sara', 'sara.web@itas.local', '$2a$10$lcFOq1cZqywvuUlZrOPzXeHy7sKwu9oXp.3uAJP7cO7p4yDlCLErq', 'Sara', 'Costa', (SELECT id FROM roles WHERE name='WEB_ADMIN'), 'ACTIVE', NOW(), NOW())

ON CONFLICT (username) DO UPDATE SET
     email = EXCLUDED.email,
     password_hash = EXCLUDED.password_hash,
     first_name = EXCLUDED.first_name,
     last_name = EXCLUDED.last_name,
     role_id = EXCLUDED.role_id,
     status = EXCLUDED.status,
     updated_at = NOW();
