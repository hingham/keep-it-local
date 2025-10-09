import { Pool, PoolClient } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize database tables
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing database with URL:', process.env.POSTGRES_URL?.replace(/:[^:]*@/, ':***@'));
    // Comment out - add sample data with runbook
    await addSampleEventServiceData(client);

/*
    // Drop existing tables if they exist
    await client.query('DROP VIEW IF EXISTS public_events CASCADE');
    await client.query('DROP VIEW IF EXISTS public_services CASCADE');
    await client.query('DROP TABLE IF EXISTS events CASCADE');
    await client.query('DROP TABLE IF EXISTS services CASCADE');
    await client.query('DROP TABLE IF EXISTS neighborhoods CASCADE');
    await client.query('DROP TABLE IF EXISTS cities CASCADE');

    // Drop existing types
    await client.query('DROP TYPE IF EXISTS event_category CASCADE');
    // Create enum type for event categories
    await client.query(`
      CREATE TYPE event_category AS ENUM ('family', 'music', 'festival', 'outdoor', 'active', 'sale');
      `);

    await client.query('DROP TYPE IF EXISTS service_category CASCADE');
    await client.query(`
      CREATE TYPE service_category AS ENUM ('kids', 'home', 'health', 'specialized', 'fitness', 'labor');
    `)

    // Create cities table
    await client.query(`
      CREATE TABLE cities (
        id SERIAL PRIMARY KEY,
        city VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(city, state)
      );
    `);

    // Create neighborhoods table
    await client.query(`
      CREATE TABLE neighborhoods (
        id SERIAL PRIMARY KEY,
        neighborhood VARCHAR(255) NOT NULL,
        city_id INTEGER REFERENCES cities(id),
        macro_neighborhood VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(neighborhood, city_id)
      );
    `);

    // Create events table with neighborhood reference
    await client.query(`
      CREATE TABLE events (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        recurring BOOLEAN DEFAULT FALSE,
        date_list DATE[], -- Array of dates for recurring events
        title VARCHAR(255) NOT NULL,
        time TIME,
        location VARCHAR(500),
        description TEXT,
        website VARCHAR(500),
        categories event_category[],
        neighborhood_id INTEGER REFERENCES neighborhoods(id),
        imageUrl VARCHAR(500),
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        delete_after DATE NOT NULL,
        internal_id VARCHAR(50),
        internal_creator_contact VARCHAR(225)
      );
    `);

    // Create services table with neighborhood foreign key
    await client.query(`
      CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        owner VARCHAR(255) NOT NULL,
        description TEXT,
        website VARCHAR(500),
        contact_number VARCHAR(20),
        contact_email VARCHAR(255),
        categories service_category[],
        neighborhood_id INTEGER REFERENCES neighborhoods(id),
        imageUrl VARCHAR(500),
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        delete_after DATE NOT NULL,
        internal_id VARCHAR(50),
        internal_creator_contact VARCHAR(225)
      );
    `);

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON neighborhoods(city_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_categories ON events USING GIN(categories)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_neighborhood_id ON events(neighborhood_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_services_owner ON services(owner)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_services_categories ON services USING GIN(categories)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_services_neighborhood_id ON services(neighborhood_id)');

    // Create user-facing views that exclude internal fields
    await client.query(`
      CREATE VIEW public_events AS
      SELECT 
        id,
        date,
        recurring,
        date_list,
        title,
        time,
        location,
        description,
        website,
        categories,
        neighborhood_id,
        imageUrl,
        verified,
        created_at,
        updated_at
      FROM events
      WHERE verified = true;
    `);

    await client.query(`
      CREATE VIEW public_services AS
      SELECT 
        id,
        title,
        owner,
        description,
        website,
        contact_number,
        contact_email,
        categories,
        neighborhood_id,
        imageUrl,
        verified,
        created_at,
        updated_at
      FROM services
      WHERE verified = true;
    `);

    console.log('Database initialized successfully');
    */
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    client.release();
  }
}

const addSampleData = async (client: PoolClient) => {
  // Insert cities sample data
  await client.query(`
    INSERT INTO cities (city, state) VALUES
    ('Seattle', 'WA')
  `);


  // Insert events sample data (3 events per neighborhood)
  await client.query(`

  `)

}

const addSampleEventServiceData = async (client: PoolClient) => {
  // Insert cities sample data
  await client.query(`
    INSERT INTO cities (city, state) VALUES
    ('Seattle', 'WA')
  `);

  // Insert 15 sample events across South Seattle and West Seattle neighborhoods
  await client.query(`
    INSERT INTO events (
      date, 
      recurring, 
      date_list, 
      title, 
      time, 
      location, 
      description, 
      website,
      categories, 
      neighborhood_id, 
      verified, 
      delete_after,
      internal_id,
      internal_creator_contact
    ) VALUES
    -- West Seattle Events (8 events) - All in Alki (neighborhood_id 56)
    ('2025-10-15', false, NULL, '(Demo) Alki Beach Summer Festival', '11:00', 'Alki Beach Park, 1702 Alki Ave SW', 'Annual summer festival with live music, food vendors, and family activities along the beautiful Alki Beach waterfront.', 'https://www.seattle.gov/parks', ARRAY['festival', 'family', 'music']::event_category[], 56, true, '2025-11-15', 'EVT001', 'events@alkibeach.org'),
    
    ('2025-10-20', true, ARRAY['2025-10-20', '2025-10-27', '2025-11-03']::date[], '(Demo) Alki Farmers Market', '10:00', 'Alki Beach Park, 1702 Alki Ave SW', 'Weekly farmers market featuring local produce, artisan goods, and community vendors. Every Sunday through November.', 'https://www.seattlefarmersmarkets.org', ARRAY['family', 'outdoor']::event_category[], 56, true, '2025-12-01', 'EVT002', 'market@alki.org'),
    
    ('2025-10-25', false, NULL, '(Demo) Alki Community Halloween Party', '18:30', 'Alki Community Center, 5817 SW Stevens St', 'Family-friendly Halloween celebration with costume contests, games, and treats for all ages.', NULL, ARRAY['family', 'festival']::event_category[], 56, true, '2025-11-01', 'EVT003', 'community@alki.org'),
    
    ('2025-11-02', false, NULL, '(Demo) Alki Beach Cleanup', '09:00', 'Alki Beach Park, 1702 Alki Ave SW', 'Community volunteer event to clean up the beach and waterfront. Tools and refreshments provided.', NULL, ARRAY['outdoor', 'active']::event_category[], 56, true, '2025-11-30', 'EVT004', 'cleanup@alki.org'),
    
    ('2025-11-08', false, NULL, '(Demo) Alki Music Showcase', '19:00', 'Alki Bathhouse Art Studio, 2701 Alki Ave SW', 'Local musicians and bands perform in an intimate waterfront setting. Open mic opportunities available.', 'https://www.alkimusicscene.com', ARRAY['music']::event_category[], 56, true, '2025-12-08', 'EVT005', 'music@alki.org'),
    
    ('2025-11-12', false, NULL, '(Demo) Alki Art Walk', '17:00', 'Alki Beach Promenade', 'Monthly art walk featuring local galleries, studios, and street art along the scenic waterfront.', 'https://www.artwalkwa.com', ARRAY['family']::event_category[], 56, true, '2025-12-12', 'EVT006', 'art@alki.org'),
    
    ('2025-11-16', false, NULL, '(Demo) Alki Point Lighthouse Tours', '13:00', 'Alki Point Lighthouse, 3201 Alki Ave SW', 'Guided tours of the historic Alki Point Lighthouse with maritime history and spectacular views.', 'https://www.uscg.mil/history', ARRAY['family', 'outdoor']::event_category[], 56, true, '2025-12-16', 'EVT007', 'tours@alkipoint.org'),
    
    ('2025-11-22', false, NULL, '(Demo) Alki Thanksgiving Food Drive', '10:00', 'Alki Community Center, 5817 SW Stevens St', 'Community food drive to support local families. Donate non-perishable items and help pack food boxes.', NULL, ARRAY['family']::event_category[], 56, true, '2025-11-25', 'EVT008', 'fooddrive@alki.org'),
    
    -- South Seattle Events (7 events) - All in Beacon Hill (neighborhood_id 78)
    ('2025-10-18', false, NULL, '(Demo) Beacon Hill Gallery Walk', '18:00', 'Beacon Ave S (between S Forest & S Spokane)', 'Monthly gallery walk showcasing local artists, live music, and food from neighborhood restaurants.', 'https://www.beaconhillart.org', ARRAY['family', 'music']::event_category[], 78, true, '2025-11-18', 'EVT009', 'gallery@beaconhill.org'),
    
    ('2025-10-26', false, NULL, '(Demo) Beacon Hill Halloween Block Party', '16:00', 'Roberto Maestas Festival Street, 15th Ave S', 'Neighborhood Halloween celebration with trick-or-treating, costume parade, and community activities.', NULL, ARRAY['family', 'festival']::event_category[], 78, true, '2025-11-01', 'EVT010', 'halloween@beaconhill.org'),
    
    ('2025-11-01', false, NULL, '(Demo) Beacon Hill Craft Fair', '10:00', 'Jefferson Park, 3801 Beacon Ave S', 'Local artisans showcase handmade crafts, jewelry, and art. Perfect for unique holiday shopping.', 'https://www.beaconhillcrafts.com', ARRAY['family', 'sale']::event_category[], 78, true, '2025-12-01', 'EVT011', 'crafts@beaconhill.org'),
    
    ('2025-11-05', false, NULL, '(Demo) Beacon Hill Community Garden Workshop', '14:00', 'Beacon Hill Community Garden, 2500 15th Ave S', 'Learn about winter gardening, composting, and sustainable growing practices. All skill levels welcome.', 'https://www.beaconhillgarden.org', ARRAY['outdoor', 'family']::event_category[], 78, true, '2025-12-05', 'EVT012', 'garden@beaconhill.org'),
    
    ('2025-11-10', false, NULL, '(Demo) Beacon Hill Community Bike Ride', '10:30', 'Jefferson Park, 3801 Beacon Ave S', 'Family-friendly bike ride through the neighborhood with stops at local parks and viewpoints.', NULL, ARRAY['active', 'family', 'outdoor']::event_category[], 78, true, '2025-12-10', 'EVT013', 'bikeride@beaconhill.org'),
    
    ('2025-11-14', false, NULL, '(Demo) Beacon Hill Book Club Meeting', '19:00', 'Beacon Hill Library, 2821 Beacon Ave S', 'Monthly book club discussing local authors and community stories. New members always welcome.', 'https://www.bhbookclub.org', ARRAY['family']::event_category[], 78, true, '2025-12-14', 'EVT014', 'books@beaconhill.org'),
    
    ('2025-11-19', false, NULL, '(Demo) Beacon Hill Community Potluck', '18:00', 'El Centro de la Raza, 2524 16th Ave S', 'Monthly community dinner where neighbors share food, stories, and build connections across cultures.', 'https://www.elcentrodelaraza.org', ARRAY['family']::event_category[], 78, true, '2025-12-19', 'EVT015', 'potluck@beaconhill.org')
  `)

}

// Helper function to test database connection
export async function testConnection() {
  try {
    console.log('Testing connection with URL:', process.env.POSTGRES_URL?.replace(/:[^:]*@/, ':***@'));
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    console.log('Connection successful:', result.rows[0]);
    return {
      success: true,
      time: result.rows[0].current_time,
      version: result.rows[0].pg_version
    };
  } catch (error) {
    console.error('Database connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: process.env.POSTGRES_URL?.replace(/:[^:]*@/, ':***@')
    };
  }
}

// Export pool for use in API routes
export { pool };