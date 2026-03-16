CREATE TABLE IF NOT EXISTS filter_config (
    id SERIAL PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO filter_config (config) VALUES ('[]'::jsonb);