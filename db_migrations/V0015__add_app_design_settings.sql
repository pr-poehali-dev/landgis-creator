-- Добавление настроек дизайна приложения
INSERT INTO t_p78972315_landgis_creator.map_settings (setting_key, setting_value, description)
VALUES 
  ('app_logo', '', 'URL логотипа приложения'),
  ('app_title', 'LandGis', 'Заголовок приложения'),
  ('app_subtitle', 'Картографическая CRM', 'Подзаголовок приложения'),
  ('app_bg_color', '#ffffff', 'Основной цвет фона приложения'),
  ('app_button_color', '#3b82f6', 'Цвет кнопок приложения')
ON CONFLICT (setting_key) DO NOTHING;
