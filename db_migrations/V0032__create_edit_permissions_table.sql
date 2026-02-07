-- Создание таблицы для хранения прав редактирования
CREATE TABLE IF NOT EXISTS t_p78972315_landgis_creator.edit_permissions (
    id SERIAL PRIMARY KEY,
    allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['admin'],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем начальную запись (только одна запись в таблице)
INSERT INTO t_p78972315_landgis_creator.edit_permissions (allowed_roles)
VALUES (ARRAY['admin', 'vip'])
ON CONFLICT DO NOTHING;

-- Создаём индекс для быстрого доступа
CREATE INDEX IF NOT EXISTS idx_edit_permissions_id ON t_p78972315_landgis_creator.edit_permissions(id);
