-- Обновляем status_mpt для объекта 1768 на "да" для проверки условной видимости
UPDATE t_p78972315_landgis_creator.properties 
SET attributes = jsonb_set(attributes, '{status_mpt}', '"да"', true)
WHERE id = 1768;
