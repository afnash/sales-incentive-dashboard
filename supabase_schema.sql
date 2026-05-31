-- Smart Incentive Calculator - Supabase Schema
-- Run this in your Supabase SQL editor to set up the database

-- Vehicle Models Table
CREATE TABLE IF NOT EXISTS vehicle_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  base_suffix VARCHAR(50),
  variant VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incentive Slabs Table
CREATE TABLE IF NOT EXISTS incentive_slabs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER, -- NULL means no upper limit (8+)
  incentive_per_car NUMERIC(10,2) NOT NULL,
  label VARCHAR(100), -- e.g., "1-3 cars", "8+ cars"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Sales Records Table
CREATE TABLE IF NOT EXISTS monthly_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_name VARCHAR(100),
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  vehicle_model_id UUID REFERENCES vehicle_models(id) ON DELETE CASCADE,
  quantity_sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, vehicle_model_id, officer_name)
);

-- Enable Row Level Security (RLS) - configure policies as needed
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_sales ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (no auth required per spec)
CREATE POLICY "Allow all for vehicle_models" ON vehicle_models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for incentive_slabs" ON incentive_slabs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for monthly_sales" ON monthly_sales FOR ALL USING (true) WITH CHECK (true);

-- Sample Data - Incentive Slabs
INSERT INTO incentive_slabs (min_quantity, max_quantity, incentive_per_car, label) VALUES
  (1, 3, 1000.00, '1-3 cars'),
  (4, 7, 2000.00, '4-7 cars'),
  (8, NULL, 3500.00, '8+ cars');

-- Sample Data - Vehicle Models
INSERT INTO vehicle_models (model_name, base_suffix, variant) VALUES
  ('Fortuner', 'GD6', 'Legender'),
  ('Innova Crysta', 'GD', 'ZX'),
  ('Camry', 'AXH', 'Hybrid'),
  ('Glanza', 'K12', 'S');
