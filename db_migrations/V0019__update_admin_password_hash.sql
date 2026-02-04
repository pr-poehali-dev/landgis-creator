-- Обновляем пароль админа на рабочий хеш от VereskGroup (тот же алгоритм bcrypt)
UPDATE companies 
SET password_hash = '$2b$12$21efFs9iraR7xVdZm7m5m.YXYSCkXMLNpqfZHQ/KW99dk16cRWMcK'
WHERE login = 'admin';