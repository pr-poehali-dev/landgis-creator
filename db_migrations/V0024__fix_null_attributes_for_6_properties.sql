-- Обновляем 6 объектов с null атрибутами, устанавливая пустой JSON объект
UPDATE t_p78972315_landgis_creator.properties
SET 
  attributes = jsonb_build_object(
    'region', CASE 
      WHEN title LIKE '%СПб%' THEN 'Санкт-Петербург и ЛО'
      WHEN title LIKE '%Хабаровск%' THEN 'Другие регионы'
      ELSE 'Москва и МО'
    END,
    'segment', CASE segment
      WHEN 'standard' THEN 'МПТ'
      WHEN 'premium' THEN 'Премиум'
      WHEN 'economy' THEN 'Эконом'
      ELSE segment
    END,
    'status_publ', CASE status
      WHEN 'available' THEN 'Доступно'
      WHEN 'reserved' THEN 'Забронировано'
      WHEN 'sold' THEN 'Продано'
      ELSE 'Доступно'
    END,
    'ird', 'Не указан',
    'oks', 'Нет',
    'date', '',
    'prava', '',
    'broker', '',
    'ekspos', 0,
    'insight', '',
    'contacts', '',
    'pravoobl', '',
    'soinvest', 'Нет',
    'str_soor', '',
    'uchastok', '',
    'istochnik', '',
    'grad_param', '',
    'type_predl', '',
    'zareg_ogran', ''
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (1724, 1819, 1865, 1716, 1824, 1767);
