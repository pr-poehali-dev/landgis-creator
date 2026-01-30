-- Create display_config table for managing attribute display settings
CREATE TABLE IF NOT EXISTS t_p78972315_landgis_creator.display_config (
  id SERIAL PRIMARY KEY,
  config_type VARCHAR(50) NOT NULL, -- 'attribute', 'image', 'document', 'contact_button', 'custom_element'
  config_key VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  visible_roles TEXT[] DEFAULT ARRAY['admin']::TEXT[],
  enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::JSONB, -- Additional settings for each type
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(config_type, config_key)
);

-- Create index for faster queries
CREATE INDEX idx_display_config_type ON t_p78972315_landgis_creator.display_config(config_type);
CREATE INDEX idx_display_config_order ON t_p78972315_landgis_creator.display_config(display_order);

-- Insert default configurations for existing attributes
INSERT INTO t_p78972315_landgis_creator.display_config (config_type, config_key, display_name, display_order, visible_roles, enabled)
SELECT 
  'attribute' as config_type,
  attribute_key as config_key,
  display_name,
  display_order,
  visible_roles,
  visible_in_table as enabled
FROM t_p78972315_landgis_creator.attribute_config
ON CONFLICT (config_type, config_key) DO NOTHING;

-- Add default UI elements
INSERT INTO t_p78972315_landgis_creator.display_config (config_type, config_key, display_name, display_order, visible_roles, enabled, settings)
VALUES 
  ('image', 'property_photos', 'Фотографии объекта', 1000, ARRAY['admin', 'user']::TEXT[], true, '{"max_count": 10, "allow_upload": true}'::JSONB),
  ('document', 'property_docs', 'Документы', 1010, ARRAY['admin']::TEXT[], true, '{"allowed_types": ["pdf", "doc", "docx"]}'::JSONB),
  ('contact_button', 'contact_owner', 'Связаться с владельцем', 1020, ARRAY['admin', 'user']::TEXT[], true, '{"button_text": "Связаться", "action": "show_contacts"}'::JSONB)
ON CONFLICT (config_type, config_key) DO NOTHING;