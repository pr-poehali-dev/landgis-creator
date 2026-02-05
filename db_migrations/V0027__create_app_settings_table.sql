CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

COMMENT ON TABLE app_settings IS 'Глобальные настройки приложения (дизайн, логотип и т.д.)';
