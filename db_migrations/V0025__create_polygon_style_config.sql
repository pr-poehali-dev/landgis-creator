-- Создаём таблицу для настройки стилей полигонов
CREATE TABLE IF NOT EXISTS t_p78972315_landgis_creator.polygon_style_config (
  id SERIAL PRIMARY KEY,
  attribute_key VARCHAR(255) NOT NULL,
  attribute_value VARCHAR(255) NOT NULL,
  fill_color VARCHAR(7) NOT NULL DEFAULT '#ff6b35',
  fill_opacity DECIMAL(3,2) NOT NULL DEFAULT 0.25 CHECK (fill_opacity >= 0 AND fill_opacity <= 1),
  stroke_color VARCHAR(7) NOT NULL DEFAULT '#ff6b35',
  stroke_width INTEGER NOT NULL DEFAULT 2 CHECK (stroke_width >= 1 AND stroke_width <= 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attribute_key, attribute_value)
);

-- Добавляем настройку активного атрибута для стилизации
CREATE TABLE IF NOT EXISTS t_p78972315_landgis_creator.polygon_style_settings (
  id SERIAL PRIMARY KEY,
  active_attribute VARCHAR(255) DEFAULT 'segment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем дефолтную настройку
INSERT INTO t_p78972315_landgis_creator.polygon_style_settings (active_attribute) 
VALUES ('segment')
ON CONFLICT DO NOTHING;

-- Добавляем дефолтные стили для сегментов
INSERT INTO t_p78972315_landgis_creator.polygon_style_config 
  (attribute_key, attribute_value, fill_color, fill_opacity, stroke_color, stroke_width)
VALUES 
  ('segment', 'МПТ', '#3b82f6', 0.25, '#3b82f6', 2),
  ('segment', 'Жилищное строительство', '#10b981', 0.25, '#10b981', 2),
  ('segment', 'Коммерческая недвижимость', '#f59e0b', 0.25, '#f59e0b', 2),
  ('segment', 'Инфраструктура', '#8b5cf6', 0.25, '#8b5cf6', 2)
ON CONFLICT (attribute_key, attribute_value) DO NOTHING;
