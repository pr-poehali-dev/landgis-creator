-- Очистка JSON-массивов в attributes.segment
-- Конвертируем ["Значение"] -> "Значение" и ["Знач1","Знач2"] -> "Знач1, Знач2"

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{segment}',
  to_jsonb(
    CASE 
      WHEN attributes->>'segment' LIKE '[%' THEN
        -- Парсим JSON массив и объединяем через запятую
        (
          SELECT string_agg(elem::text, ', ')
          FROM jsonb_array_elements_text((attributes->>'segment')::jsonb) AS elem
        )
      ELSE
        attributes->>'segment'
    END
  )
)
WHERE attributes->>'segment' LIKE '[%';