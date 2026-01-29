CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('land', 'commercial', 'residential')),
  price DECIMAL(15, 2) NOT NULL,
  area DECIMAL(10, 2) NOT NULL,
  location VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  segment VARCHAR(50) NOT NULL CHECK (segment IN ('premium', 'standard', 'economy')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('available', 'reserved', 'sold')),
  boundary JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_segment ON properties(segment);
CREATE INDEX idx_properties_boundary ON properties USING GIN (boundary) WHERE boundary IS NOT NULL;