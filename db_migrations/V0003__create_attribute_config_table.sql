CREATE TABLE IF NOT EXISTS attribute_config (
    id SERIAL PRIMARY KEY,
    attribute_key VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    visible_in_table BOOLEAN DEFAULT false,
    visible_roles TEXT[] DEFAULT ARRAY['admin']::TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attribute_key ON attribute_config(attribute_key);
CREATE INDEX IF NOT EXISTS idx_display_order ON attribute_config(display_order);

INSERT INTO attribute_config (attribute_key, display_name, display_order, visible_in_table, visible_roles) VALUES
('name', 'Название', 1, true, ARRAY['admin', 'user']),
('uchastok', 'Участок', 2, true, ARRAY['admin', 'user']),
('prava', 'Права', 3, false, ARRAY['admin']),
('ird', 'ИРД', 4, true, ARRAY['admin', 'user']),
('grad_param', 'Градостроительные параметры', 5, false, ARRAY['admin']),
('oks', 'ОКС', 6, true, ARRAY['admin', 'user']),
('segment', 'Сегмент', 7, true, ARRAY['admin', 'user']),
('ekspos', 'Экспозиция', 8, false, ARRAY['admin']),
('date', 'Дата', 9, true, ARRAY['admin', 'user']),
('status_publ', 'Статус публикации', 10, true, ARRAY['admin'])
ON CONFLICT (attribute_key) DO NOTHING;