-- Конвертация атрибута ekspos из текста в число
-- Извлекаем первое число из текста, убираем пробелы и "руб."
-- Если число не найдено или текст сложный - оставляем NULL

UPDATE t_p78972315_landgis_creator.properties
SET attributes = jsonb_set(
  attributes,
  '{ekspos}',
  to_jsonb(
    NULLIF(
      regexp_replace(
        regexp_replace(
          split_part(attributes->>'ekspos', E'\n', 1),
          '[^\d]',
          '',
          'g'
        ),
        '^$',
        'NULL'
      ),
      'NULL'
    )::numeric
  )
)
WHERE attributes ? 'ekspos'
  AND attributes->>'ekspos' ~ '\d'
  AND length(regexp_replace(attributes->>'ekspos', '[^\d]', '', 'g')) > 0;