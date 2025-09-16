-- Updated schema for Keep it Local
-- Run this directly in Vercel Postgres dashboard or use the /api/setup endpoint

-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- Create enum type for event categories
DO $$ BEGIN
  CREATE TYPE event_category AS ENUM ('family', 'music', 'festival');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  date_list TEXT[], -- Array of dates for recurring events
  title VARCHAR(255) NOT NULL,
  time TIME,
  location VARCHAR(500),
  categories event_category[],
  neighborhood VARCHAR(255),
  imageUrl VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create services table
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  description TEXT,
  neighborhood VARCHAR(255),
  imageUrl VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_categories ON events USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_services_owner ON services(owner);

-- Insert sample data
INSERT INTO events (date, recurring, title, time, location, categories) VALUES
  ('2025-08-25', false, 'Summer Music Festival', '18:00', 'Downtown Park', ARRAY['music', 'festival']::event_category[]),
  ('2025-08-30', true, 'Family Movie Night', '19:30', 'Community Center', ARRAY['family']::event_category[]),
  ('2025-09-01', false, 'Local Artists Showcase', '14:00', 'Art Gallery', ARRAY['music']::event_category[]);

INSERT INTO services (title, owner, description) VALUES
  ('Local Delivery Service', 'Mike''s Bikes', 'Fast and reliable delivery for local businesses'),
  ('Pet Sitting', 'Sarah Johnson', 'Professional pet sitting and dog walking services'),
  ('Home Repair', 'Fix-It Frank', 'Handyman services for all your home repair needs');
