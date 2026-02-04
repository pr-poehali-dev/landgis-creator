-- Создание администратора по умолчанию
INSERT INTO companies (name, login, password_hash, plain_password, role, is_active)
VALUES (
    'Администратор',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5uxT8E8KQXVS2', -- admin123
    'admin123',
    'admin',
    true
)
ON CONFLICT (login) DO NOTHING;