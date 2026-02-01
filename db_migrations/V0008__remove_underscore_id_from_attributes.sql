-- Удаление поля _id из JSONB attributes во всех записях
UPDATE t_p78972315_landgis_creator.properties
SET attributes = attributes - '_id'
WHERE attributes ? '_id';