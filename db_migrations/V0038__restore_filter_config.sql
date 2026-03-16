UPDATE t_p78972315_landgis_creator.filter_config 
SET config = '[
  {
    "id": "region",
    "label": "Регион",
    "enabled": true,
    "order": 1,
    "options": ["Другие регионы", "Москва и МО", "СПб и ЛО"],
    "defaultValues": [],
    "attributePath": "attributes.region"
  },
  {
    "id": "segment",
    "label": "Сегмент",
    "enabled": true,
    "order": 2,
    "options": ["Жилищное строительство", "Гостиницы и апартаменты", "Торговля и ритейл", "Офисы", "Склады", "Производство", "СХ и КФХ", "МПТ"],
    "defaultValues": [],
    "attributePath": "attributes.segment"
  },
  {
    "id": "status",
    "label": "Статус",
    "enabled": false,
    "order": 3,
    "options": ["available", "reserved", "sold"],
    "defaultValues": [],
    "attributePath": "status"
  },
  {
    "id": "type",
    "label": "Тип",
    "enabled": false,
    "order": 4,
    "options": ["land", "commercial", "residential"],
    "defaultValues": [],
    "attributePath": "type"
  },
  {
    "id": "attributes_ird",
    "label": "Наличие ИРД",
    "enabled": true,
    "order": 5,
    "options": ["Без ИРД", "ГЗК", "АГР", "ППТ", "ГПЗУ", "РнС"],
    "defaultValues": [],
    "attributePath": "attributes.ird"
  },
  {
    "id": "status_publ",
    "label": "Статус публикации",
    "enabled": true,
    "order": 6,
    "options": ["Опубликован", "На модерации", "На паузе", "Снят с продажи", "Продан", "Архив"],
    "defaultValues": ["Опубликован"],
    "attributePath": "attributes.status_publ"
  },
  {
    "id": "attributes_soinvest",
    "label": "Возможность соинвеста",
    "enabled": true,
    "order": 7,
    "options": ["Да", "Нет"],
    "defaultValues": [],
    "attributePath": "attributes.soinvest"
  },
  {
    "id": "attributes_oks",
    "label": "Наличие ОКС",
    "enabled": true,
    "order": 8,
    "options": ["Да", "Нет"],
    "defaultValues": [],
    "attributePath": "attributes.oks"
  },
  {
    "id": "attributes_status_mpt",
    "label": "Статус МПТ",
    "enabled": true,
    "order": 9,
    "options": ["true", "false"],
    "defaultValues": [],
    "attributePath": "attributes.status_mpt"
  },
  {
    "id": "attributes_broker",
    "label": "Уполномоченный брокер",
    "enabled": true,
    "order": 10,
    "options": ["Вереск Групп"],
    "defaultValues": [],
    "attributePath": "attributes.broker"
  },
  {
    "id": "attributes_type_predl",
    "label": "Тип предложения",
    "enabled": true,
    "order": 11,
    "options": ["Прямая продажа"],
    "defaultValues": [],
    "attributePath": "attributes.type_predl"
  }
]'::jsonb,
updated_at = CURRENT_TIMESTAMP
WHERE id = (SELECT id FROM t_p78972315_landgis_creator.filter_config ORDER BY id LIMIT 1);