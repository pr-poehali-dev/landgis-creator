-- Скрываем технические атрибуты id, _id и lgota из отображения
UPDATE t_p78972315_landgis_creator.attribute_config 
SET visible_in_table = false, 
    updated_at = CURRENT_TIMESTAMP
WHERE attribute_key IN ('id', '_id', 'lgota');
