-- Исправляем некорректное значение segment для объекта 1768
UPDATE t_p78972315_landgis_creator.properties 
SET attributes = jsonb_set(attributes, '{segment}', '"Производство"', true)
WHERE id = 1768 AND attributes->>'segment' = '["[]","Производство"]';
