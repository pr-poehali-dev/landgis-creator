-- Восстановление атрибутов объекта 1768

UPDATE t_p78972315_landgis_creator.properties
SET attributes = '{
  "ID": "12345",
  "ird": "",
  "oks": "нет",
  "date": "",
  "prava": "",
  "broker": "",
  "ekspos": 0,
  "region": "",
  "insight": "",
  "segment": "Test",
  "contacts": "",
  "pravoobl": "",
  "soinvest": "",
  "str_soor": "",
  "uchastok": "",
  "istochnik": "",
  "grad_param": "",
  "type_predl": "",
  "status_publ": "",
  "zareg_ogran": "",
  "status_mpt": "нет"
}'::jsonb,
updated_at = CURRENT_TIMESTAMP
WHERE id = 1768;