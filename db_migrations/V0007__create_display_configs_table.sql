-- Создание таблицы для настроек отображения атрибутов
CREATE TABLE IF NOT EXISTS display_configs (
    id SERIAL PRIMARY KEY,
    config_type VARCHAR(50) NOT NULL DEFAULT 'attribute',
    config_key VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    visible_roles TEXT[] NOT NULL DEFAULT ARRAY['admin']::TEXT[],
    enabled BOOLEAN NOT NULL DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    format_type VARCHAR(50),
    format_options JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(config_key)
);

-- Индекс для быстрой сортировки
CREATE INDEX IF NOT EXISTS idx_display_configs_order ON display_configs(display_order);

-- Вставляем начальные данные
INSERT INTO display_configs (id, config_key, display_name, display_order, enabled) VALUES
(12, 'ID', 'ID', 0, true),
(26, 'test_attr', 'Test Attribute', 1, true),
(3, 'prava', 'Права', 2, true),
(1, 'name', 'Название', 3, true),
(2, 'uchastok', 'Участок', 4, true),
(4, 'ird', 'ИРД', 5, true),
(5, 'grad_param', 'Градостроительные параметры', 6, true),
(6, 'oks', 'Наличие ОКС', 7, true),
(7, 'segment', 'Сегмент', 8, true),
(8, 'ekspos', 'Экспозиция', 9, true),
(9, 'date', 'Дата', 10, true),
(10, 'status_publ', 'Статус публикации', 11, true),
(13, 'id', 'Id', 12, true),
(14, '_id', '_id', 13, true),
(15, 'broker', 'Broker', 14, true),
(16, 'insight', 'Insight', 15, true),
(17, 'contacts', 'Contacts', 16, true),
(18, 'pravoobl', 'Pravoobl', 17, true),
(19, 'soinvest', 'Soinvest', 18, false),
(20, 'str_soor', 'Str soor', 19, false),
(21, 'telegram', 'Telegram', 20, false),
(22, 'type_predl', 'Type predl', 21, false),
(23, 'zareg_ogran', 'Zareg ogran', 22, false)
ON CONFLICT (config_key) DO NOTHING;
