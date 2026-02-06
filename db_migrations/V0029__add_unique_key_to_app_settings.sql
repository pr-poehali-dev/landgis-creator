-- Добавляем уникальный ключ на setting_key
ALTER TABLE t_p78972315_landgis_creator.app_settings
ADD CONSTRAINT app_settings_setting_key_unique UNIQUE (setting_key);
