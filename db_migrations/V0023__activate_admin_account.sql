-- Активация аккаунта администратора
UPDATE t_p78972315_landgis_creator.companies 
SET is_active = true, updated_at = CURRENT_TIMESTAMP
WHERE role = 'admin' AND login = 'admin';