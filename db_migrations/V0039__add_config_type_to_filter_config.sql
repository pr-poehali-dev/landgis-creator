ALTER TABLE filter_config ADD COLUMN IF NOT EXISTS config_type VARCHAR(50) NOT NULL DEFAULT 'filters';

UPDATE filter_config SET config_type = 'filters' WHERE config_type = 'filters';