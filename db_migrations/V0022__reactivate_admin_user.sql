-- Активируем администратора повторно
UPDATE companies 
SET is_active = true
WHERE login = 'admin';