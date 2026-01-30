-- Создание таблицы для настроек отображения атрибутов и элементов интерфейса
CREATE TABLE IF NOT EXISTS t_p78972315_landgis_creator.display_config (
    id SERIAL PRIMARY KEY,
    config_type VARCHAR(50) NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    visible_roles TEXT[] NOT NULL DEFAULT '{admin}',
    enabled BOOLEAN NOT NULL DEFAULT true,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_key)
);

CREATE INDEX IF NOT EXISTS idx_display_config_type ON t_p78972315_landgis_creator.display_config(config_type);
CREATE INDEX IF NOT EXISTS idx_display_config_order ON t_p78972315_landgis_creator.display_config(display_order);
CREATE INDEX IF NOT EXISTS idx_display_config_enabled ON t_p78972315_landgis_creator.display_config(enabled);