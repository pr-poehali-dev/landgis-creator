-- Нормализация boolean/toggle полей: "да"/"Да"/"нет"/"Нет" → "true"/"false"
-- Это исправит проблему с сохранением toggle полей

-- status_mpt
UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{status_mpt}',
  '"true"'
)
WHERE attributes->>'status_mpt' IN ('да', 'Да', 'yes', 'Yes');

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{status_mpt}',
  '"false"'
)
WHERE attributes->>'status_mpt' IN ('нет', 'Нет', 'no', 'No') 
   OR attributes->>'status_mpt' IS NULL;

-- oks
UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{oks}',
  '"true"'
)
WHERE attributes->>'oks' IN ('да', 'Да', 'yes', 'Yes');

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{oks}',
  '"false"'
)
WHERE attributes->>'oks' IN ('нет', 'Нет', 'no', 'No') 
   OR attributes->>'oks' IS NULL;

-- soinvest
UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{soinvest}',
  '"true"'
)
WHERE attributes->>'soinvest' IN ('да', 'Да', 'yes', 'Yes');

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{soinvest}',
  '"false"'
)
WHERE attributes->>'soinvest' IN ('нет', 'Нет', 'no', 'No') 
   OR attributes->>'soinvest' IS NULL;

-- mpt (если есть)
UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{mpt}',
  '"true"'
)
WHERE attributes->>'mpt' IN ('да', 'Да', 'yes', 'Yes');

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{mpt}',
  '"false"'
)
WHERE attributes->>'mpt' IN ('нет', 'Нет', 'no', 'No') 
   OR attributes->>'mpt' IS NULL;