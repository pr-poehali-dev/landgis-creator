-- Добавляем колонку для типа атрибута
ALTER TABLE t_p78972315_landgis_creator.attribute_config 
ADD COLUMN format_type VARCHAR(50) DEFAULT 'text',
ADD COLUMN format_options JSONB DEFAULT NULL;

-- Поддерживаемые типы: text, number, money, boolean, select, date, textarea
COMMENT ON COLUMN t_p78972315_landgis_creator.attribute_config.format_type IS 'Тип атрибута: text, number, money, boolean, select, date, textarea';
COMMENT ON COLUMN t_p78972315_landgis_creator.attribute_config.format_options IS 'Опции для типа (например, список значений для select)';