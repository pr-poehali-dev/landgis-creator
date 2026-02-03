-- Добавление полей авторизации в таблицу companies
ALTER TABLE companies 
ADD COLUMN login VARCHAR(100) UNIQUE,
ADD COLUMN password_hash VARCHAR(255),
ADD COLUMN role VARCHAR(50) DEFAULT 'user';

-- Индексы для быстрого поиска
CREATE INDEX idx_companies_login ON companies(login);
CREATE INDEX idx_companies_role ON companies(role);

-- Вставка администратора по умолчанию (пароль: admin123, bcrypt hash)
INSERT INTO companies (name, login, password_hash, role, is_active) 
VALUES ('Администратор', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYJL.8S8jYe', 'admin', true)
ON CONFLICT (login) DO NOTHING;