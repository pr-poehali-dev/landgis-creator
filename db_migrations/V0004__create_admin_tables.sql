-- Таблица настроек карты
CREATE TABLE IF NOT EXISTS map_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица компаний
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(12),
    kpp VARCHAR(9),
    legal_address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица настроек фильтров
CREATE TABLE IF NOT EXISTS filter_settings (
    id SERIAL PRIMARY KEY,
    filter_key VARCHAR(255) UNIQUE NOT NULL,
    filter_label VARCHAR(255) NOT NULL,
    filter_type VARCHAR(50) NOT NULL,
    options JSONB,
    is_enabled BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_companies_inn ON companies(inn);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Начальные данные для настроек карты
INSERT INTO map_settings (setting_key, setting_value, description) VALUES
('default_center_lat', '55.751244', 'Широта центра карты по умолчанию'),
('default_center_lon', '37.618423', 'Долгота центра карты по умолчанию'),
('default_zoom', '10', 'Уровень масштабирования по умолчанию'),
('map_style', 'default', 'Стиль отображения карты'),
('show_controls', 'true', 'Показывать элементы управления'),
('show_search', 'true', 'Показывать поиск на карте'),
('marker_color', '#3B82F6', 'Цвет маркеров по умолчанию'),
('boundary_color', '#8B5CF6', 'Цвет границ участков'),
('boundary_width', '2', 'Толщина линий границ')
ON CONFLICT (setting_key) DO NOTHING;

-- Начальные данные для настроек фильтров
INSERT INTO filter_settings (filter_key, filter_label, filter_type, options, is_enabled, display_order) VALUES
('property_type', 'Тип объекта', 'multiselect', '{"values": ["land", "commercial", "residential"]}', true, 1),
('status', 'Статус', 'multiselect', '{"values": ["available", "reserved", "sold"]}', true, 2),
('segment', 'Сегмент', 'multiselect', '{"values": ["premium", "standard", "economy"]}', true, 3),
('price_range', 'Цена', 'range', '{"min": 0, "max": 100000000, "step": 100000}', true, 4),
('area_range', 'Площадь', 'range', '{"min": 0, "max": 10000, "step": 10}', true, 5)
ON CONFLICT (filter_key) DO NOTHING;