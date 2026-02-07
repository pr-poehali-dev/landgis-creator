-- Создаём новую таблицу landplots с той же структурой что и properties
CREATE TABLE IF NOT EXISTS landplots (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    area NUMERIC(10,2) NOT NULL,
    location VARCHAR(500) NOT NULL,
    latitude NUMERIC(10,6) NOT NULL,
    longitude NUMERIC(10,6) NOT NULL,
    segment VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    boundary JSONB,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Копируем все 189 участков из properties в landplots
INSERT INTO landplots (
    id, title, type, price, area, location, 
    latitude, longitude, segment, status, 
    boundary, attributes, created_at, updated_at
)
SELECT 
    id, title, type, price, area, location,
    latitude, longitude, segment, status,
    boundary, attributes, created_at, updated_at
FROM properties
ORDER BY id;

-- Обновляем последовательность для автоинкремента ID
SELECT setval('landplots_id_seq', (SELECT MAX(id) FROM landplots));