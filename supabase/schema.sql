-- Nautix Database Schema
-- Opprett tabeller for båtinformasjon, motor, utstyr og dokumenter

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Boats table (Båtinformasjon)
CREATE TABLE boats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  type VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  registration_number VARCHAR(50),
  length_meters DECIMAL(5,2),
  width_meters DECIMAL(5,2),
  weight_kg INTEGER,
  hull_material VARCHAR(100),
  hull_color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engines table (Motordetaljer)
CREATE TABLE engines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  horsepower INTEGER,
  year INTEGER,
  serial_number VARCHAR(100),
  engine_type VARCHAR(100),
  fuel_type VARCHAR(50),
  tank_capacity_liters INTEGER,
  fuel_consumption_lph DECIMAL(5,2),
  propeller VARCHAR(100),
  oil_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table (Utstyr & Tilbehør)
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active', -- active, needs-service, expired
  expiry_date DATE,
  purchase_date DATE,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table (Dokumenter)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100), -- forsikring, registrering, kontrakt, sertifikat
  file_path VARCHAR(500),
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'valid', -- valid, expiring-soon, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Boats policies
CREATE POLICY "Users can view their own boats"
  ON boats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boats"
  ON boats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boats"
  ON boats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boats"
  ON boats FOR DELETE
  USING (auth.uid() = user_id);

-- Engines policies
CREATE POLICY "Users can view their own engines"
  ON engines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own engines"
  ON engines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own engines"
  ON engines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own engines"
  ON engines FOR DELETE
  USING (auth.uid() = user_id);

-- Equipment policies
CREATE POLICY "Users can view their own equipment"
  ON equipment FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equipment"
  ON equipment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment"
  ON equipment FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment"
  ON equipment FOR DELETE
  USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_boats_user_id ON boats(user_id);
CREATE INDEX idx_engines_boat_id ON engines(boat_id);
CREATE INDEX idx_engines_user_id ON engines(user_id);
CREATE INDEX idx_equipment_boat_id ON equipment(boat_id);
CREATE INDEX idx_equipment_user_id ON equipment(user_id);
CREATE INDEX idx_documents_boat_id ON documents(boat_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('boat-documents', 'boat-documents', false);

-- Storage policies for boat documents
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'boat-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'boat-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'boat-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'boat-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Maintenance Log table (Vedlikeholdslogg)
CREATE TABLE maintenance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- motor, skrog, elektrisitet, annet
  type VARCHAR(100), -- reparasjon, service, skade, oppgradering, inspeksjon
  date DATE NOT NULL,
  cost DECIMAL(10,2),
  performed_by VARCHAR(255), -- hvem som utførte arbeidet
  hours_spent DECIMAL(5,2),
  parts_used TEXT,
  status VARCHAR(50) DEFAULT 'completed', -- completed, pending, in-progress
  priority VARCHAR(50), -- low, medium, high
  location VARCHAR(255), -- hvor arbeidet ble utført
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table (Påminnelser)
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  maintenance_log_id UUID REFERENCES maintenance_log(id) ON DELETE SET NULL, -- kobling til vedlikeholdslogg
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high
  category VARCHAR(100), -- motor, skrog, sikkerhet, sesong, annet
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  recurrence VARCHAR(50), -- none, monthly, quarterly, yearly, custom
  recurrence_interval INTEGER, -- antall dager for custom recurrence
  ai_suggested BOOLEAN DEFAULT false, -- om påminnelsen ble generert av AI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Log RLS
ALTER TABLE maintenance_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maintenance logs"
  ON maintenance_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance logs"
  ON maintenance_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance logs"
  ON maintenance_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance logs"
  ON maintenance_log FOR DELETE
  USING (auth.uid() = user_id);

-- Reminders RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_maintenance_log_user_id ON maintenance_log(user_id);
CREATE INDEX idx_maintenance_log_boat_id ON maintenance_log(boat_id);
CREATE INDEX idx_maintenance_log_date ON maintenance_log(date);
CREATE INDEX idx_maintenance_log_category ON maintenance_log(category);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_boat_id ON reminders(boat_id);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_reminders_completed ON reminders(completed);
