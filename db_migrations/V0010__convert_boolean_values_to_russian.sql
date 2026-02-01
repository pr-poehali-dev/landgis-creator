-- Конвертация boolean значений true/false в текстовые да/нет

-- Обновляем oks: true → да, false → нет
UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{oks}',
  '"нет"'
)
WHERE attributes->>'oks' = 'false';

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{oks}',
  '"да"'
)
WHERE attributes->>'oks' = 'true';

-- Обновляем status_mpt: true → да, false → нет
UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{status_mpt}',
  '"нет"'
)
WHERE attributes->>'status_mpt' = 'false';

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{status_mpt}',
  '"да"'
)
WHERE attributes->>'status_mpt' = 'true';

-- Обновляем soinvest (если есть boolean значения)
UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{soinvest}',
  '"нет"'
)
WHERE attributes->>'soinvest' = 'false';

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{soinvest}',
  '"да"'
)
WHERE attributes->>'soinvest' = 'true';