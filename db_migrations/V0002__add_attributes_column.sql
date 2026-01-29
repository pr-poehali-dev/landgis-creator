-- Добавляем поле для хранения произвольных атрибутов из GeoJSON
ALTER TABLE properties 
ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;

-- Создаём индекс для быстрого поиска по атрибутам
CREATE INDEX idx_properties_attributes ON properties USING gin(attributes);

COMMENT ON COLUMN properties.attributes IS 'Дополнительные атрибуты из GeoJSON (все поля properties)';