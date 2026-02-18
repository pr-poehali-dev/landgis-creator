-- Синхронизация title и attributes.name
-- 1. Где title пуст, но attributes.name заполнен — берём name
UPDATE t_p78972315_landgis_creator.landplots
SET title = attributes->>'name'
WHERE (title IS NULL OR title = '')
  AND attributes->>'name' IS NOT NULL
  AND attributes->>'name' != ''
  AND attributes->>'name' != '""';

-- 2. Где title заполнен — синхронизируем attributes.name с title
UPDATE t_p78972315_landgis_creator.landplots
SET attributes = jsonb_set(COALESCE(attributes, '{}'::jsonb), '{name}', to_jsonb(title))
WHERE title IS NOT NULL AND title != '';