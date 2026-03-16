UPDATE t_p78972315_landgis_creator.attribute_config 
SET format_options = '{"options": ["На модерации", "Опубликован", "На паузе", "Продан", "Снят с продажи", "Архив"]}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE attribute_key = 'status_publ';