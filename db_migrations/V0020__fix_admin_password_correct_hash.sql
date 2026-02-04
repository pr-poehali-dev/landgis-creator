-- Обновляем пароль админа на правильный bcrypt хеш для admin123
UPDATE companies 
SET password_hash = '$2b$12$gF7n8Ce.hZy.o7xYvPlHe.cB8ALcXOuOnnmrnC4B1OL.O9EXHTn8C',
    plain_password = 'admin123'
WHERE login = 'admin';