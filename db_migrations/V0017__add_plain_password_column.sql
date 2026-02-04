-- Добавление колонки для хранения открытого пароля (только для админа)
ALTER TABLE companies ADD COLUMN plain_password TEXT;