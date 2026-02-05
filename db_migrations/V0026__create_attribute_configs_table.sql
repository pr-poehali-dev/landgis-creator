-- Создание таблицы для хранения настроек атрибутов (единая для всех пользователей)
CREATE TABLE IF NOT EXISTS attribute_configs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) NOT NULL UNIQUE,
  config_data JSONB NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрой сортировки по порядку
CREATE INDEX idx_attribute_configs_display_order ON attribute_configs(display_order);

COMMENT ON TABLE attribute_configs IS 'Глобальные настройки отображения атрибутов для всех пользователей';
COMMENT ON COLUMN attribute_configs.config_key IS 'Уникальный ключ атрибута (ird, oks, region и т.д.)';
COMMENT ON COLUMN attribute_configs.config_data IS 'JSON с настройками: displayName, formatType, formatOptions и т.д.';
COMMENT ON COLUMN attribute_configs.display_order IS 'Порядок отображения атрибута';