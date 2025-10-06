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

    // Comment out - add sample data with runbook
    // await addSampleData(client);

    console.log('Database initialized successfully');
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
    ('Austin', 'TX'),
    ('Seattle', 'WA')
  `);

  // Insert neighborhood sample data
  await client.query(`
    INSERT INTO neighborhoods (neighborhood, city_id, macro_neighborhood) VALUES
    ('Columbia City', 2, 'South Seattle'),
    ('Mount Baker', 2, 'South Seattle'),
    ('North Beacon Hill', 2, 'South Seattle'),
    ('South Beacon Hill', 2, 'South Seattle'),
    ('Seward Park', 2, 'South Seattle'),
    ('Rainier Beach', 2, 'South Seattle'),
    ('SODO', 2, 'South Seattle'),
    ('Leschi', 2, 'South Seattle'),
    ('Georgetown', 2, 'South Seattle'),
    ('Alki', 2, 'West Seattle'),
    ('North Admiral', 2, 'West Seattle'),
    ('Genesee', 2, 'West Seattle'),
    ('North Delridge', 2, 'West Seattle'),
    ('Fairmount Park', 2, 'West Seattle'),
    ('Seaview', 2, 'West Seattle'),
    ('Gatewood', 2, 'West Seattle'),
    ('High Point', 2, 'West Seattle'),
    ('Riverview', 2, 'West Seattle'),
    ('Fauntleroy', 2, 'West Seattle'),
    ('Roxhill', 2, 'West Seattle'),
    ('South Delridge', 2, 'West Seattle'),
    ('Highland Park', 2, 'West Seattle'),
    ('South Park', 2, 'West Seattle'),
    ('Arbor Heights', 2, 'West Seattle')
    `);

  // Insert events sample data (3 events per neighborhood)
  await client.query(`
      INSERT INTO events(date, recurring, title, time, location, description, website, categories, neighborhood_id, imageUrl, verified, delete_after, internal_id, internal_creator_contact) VALUES
        --Downtown events (neighborhood_id = 1)
      ('2025-08-25', false, 'Downtown Art Walk', '18:00', 'Congress Avenue', 'Monthly art walk featuring local artists and galleries', 'https://downtownaustin.com/art-walk', ARRAY['family', 'festival']:: event_category[], 1, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500', true, '2025-12-31', 'EVT-DT-001', 'sarah.downtown@austinarts.org'),
      ('2025-08-28', true, 'Jazz Night at The Rooftop', '20:00', 'Downtown Jazz Club', 'Weekly live jazz performances with local and touring musicians', 'https://rooftopjazzclub.com', ARRAY['music']:: event_category[], 1, 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500', true, '2025-12-31', 'EVT-DT-002', 'booking@rooftopjazzclub.com'),
      ('2025-09-02', false, 'Food Truck Friday', '11:00', 'Republic Square Park', 'Weekly gathering of local food trucks with live music and activities', 'https://republicpark.com/events', ARRAY['family', 'festival']:: event_category[], 1, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500', true, '2025-09-03', 'EVT-DT-003', 'events@republicpark.com'),

    --East Village events (neighborhood_id = 2)
      ('2025-08-26', false, 'East Side Music Festival', '16:00', 'Cheer Up Charlies', 'Annual music festival showcasing local indie and alternative bands', 'https://eastsidemusicfest.com', ARRAY['music', 'festival']:: event_category[], 2, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500', true, '2025-08-27', 'EVT-EV-001', 'mike.eastside@musicfest.com'),
      ('2025-08-29', true, 'Community Garden Workshop', '10:00', 'East Village Community Center', 'Learn organic gardening techniques and sustainable practices', 'https://eastvillagecc.org/garden', ARRAY['family']:: event_category[], 2, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500', true, '2025-12-31', 'EVT-EV-002', 'garden@eastvillagecc.org'),
    ('2025-09-05', false, 'Vintage Market', '09:00', 'East 6th Street', 'Monthly vintage clothing, furniture, and collectibles market', 'https://east6thmarket.com', ARRAY['family']:: event_category[], 2, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500', true, '2025-09-06', 'EVT-EV-003', 'maria@east6thmarket.com'),

    --South Lamar events (neighborhood_id = 3)
      ('2025-08-27', false, 'Live Music at The Continental', '21:00', 'Continental Club', 'Weekly live music featuring local Austin bands and touring acts', 'https://continentalclub.com', ARRAY['music']:: event_category[], 3, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500', true, '2025-12-31', 'EVT-SL-001', 'booking@continentalclub.com'),
      ('2025-08-30', true, 'Family Movie Night', '19:30', 'Lamar Union', 'Free outdoor movie screenings for families every Friday night', 'https://lamarunion.com/movies', ARRAY['family']:: event_category[], 3, 'https://images.unsplash.com/photo-1489185078970-67042088056f?w=500', true, '2025-12-31', 'EVT-SL-002', 'events@lamarunion.com'),
    ('2025-09-03', false, 'South Austin Food Festival', '12:00', 'Zilker Park', 'Annual celebration of South Austin food scene with local restaurants', 'https://southaustinfoodfest.com', ARRAY['family', 'festival']:: event_category[], 3, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500', true, '2025-09-04', 'EVT-SL-003', 'organizer@southaustinfoodfest.com'),

    --Beacon Hill events (neighborhood_id = 4)
      ('2025-08-24', false, 'Beacon Hill Block Party', '14:00', 'Beacon Hill Community Center', 'Annual neighborhood block party with food, music, and activities', 'https://beaconhillseattle.org/blockparty', ARRAY['family', 'festival']:: event_category[], 4, 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500', true, '2025-08-25', 'EVT-BH-001', 'community@beaconhillseattle.org'),
      ('2025-09-01', true, 'Sunday Morning Yoga', '09:00', 'Jefferson Park', 'Free outdoor yoga classes every Sunday morning for all skill levels', 'https://beaconhillseattle.org/yoga', ARRAY['family']:: event_category[], 4, 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=500', true, '2025-12-31', 'EVT-BH-002', 'yoga@beaconhillseattle.org'),
      ('2025-09-07', false, 'International Food Festival', '12:00', 'Beacon Avenue', 'Celebrating the diverse cultures of Beacon Hill through food and music', 'https://beaconhillfoodfest.org', ARRAY['family', 'festival']:: event_category[], 4, 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=500', true, '2025-09-08', 'EVT-BH-003', 'festival@beaconhillfoodfest.org'),

    --Columbia City events (neighborhood_id = 5)
      ('2025-08-31', false, 'Columbia City Gallery Walk', '17:00', 'Rainier Avenue South', 'Monthly gallery walk featuring local artists and art spaces', 'https://columbiacitygallery.com', ARRAY['family', 'festival']:: event_category[], 5, 'https://images.unsplash.com/photo-1544967882-6abaa8b79e80?w=500', true, '2025-09-01', 'EVT-CC-001', 'curator@columbiacitygallery.com'),
      ('2025-09-04', true, 'Acoustic Open Mic Night', '19:00', 'Columbia City Theater', 'Weekly open mic for acoustic musicians and spoken word artists', 'https://columbiacitytheater.com/openmic', ARRAY['music']:: event_category[], 5, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500', true, '2025-12-31', 'EVT-CC-002', 'openmic@columbiacitytheater.com'),
      ('2025-09-08', false, 'Neighborhood Farmers Market', '10:00', 'Genesee Park', 'Weekly farmers market with local produce, crafts, and prepared foods', 'https://columbiacitymarket.org', ARRAY['family']:: event_category[], 5, 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=500', true, '2025-09-09', 'EVT-CC-003', 'market@columbiacitymarket.org')
    `);

  // Insert services sample data (3 services per neighborhood)
  // await client.query(`
  //     INSERT INTO services(title, owner, description, website, contact_number, contact_email, categories, neighborhood_id, imageUrl, verified, delete_after, internal_id, internal_creator_contact) VALUES
  //   --Downtown services (neighborhood_id = 1)
  //     ('Downtown Bike Delivery', 'Austin Cycles', 'Fast bike delivery service for downtown businesses and residents', 'https://austincycles.com/delivery', '(512) 555-0101', 'delivery@austincycles.com', ARRAY['labor']::service_category[], 1, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500', true, '2025-12-31', 'SVC-DT-001', 'admin@austincycles.com'),
  //     ('Executive Pet Care', 'Sarah Johnson', 'Premium pet sitting and dog walking for downtown professionals', 'https://executivepetcare.com', '(512) 555-0102', 'sarah@executivepetcare.com', ARRAY['specialized']::service_category[], 1, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500', true, '2025-12-31', 'SVC-DT-002', 'sarah@executivepetcare.com'),
  //     ('Office IT Support', 'TechFix Austin', 'On-site computer and network support for downtown offices', 'https://techfixaustin.com', '(512) 555-0103', 'support@techfixaustin.com', ARRAY['specialized']::service_category[], 1, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500', true, '2025-12-31', 'SVC-DT-003', 'contact@techfixaustin.com'),

  //     --East Village services (neighborhood_id = 2)
  //       ('Local Organic Delivery', 'East Side Farms', 'Fresh organic produce delivery from local East Austin farms', 'https://eastsidefarms.com', '(512) 555-0201', 'orders@eastsidefarms.com', ARRAY['home']::service_category[], 2, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500', true, '2025-12-31', 'SVC-EV-001', 'admin@eastsidefarms.com'),
  //       ('Vintage Furniture Restoration', 'Mike Rodriguez', 'Restoration and repair of vintage and antique furniture', 'https://vintagerestoration.com', '(512) 555-0202', 'mike@vintagerestoration.com', ARRAY['home']::service_category[], 2, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', true, '2025-12-31', 'SVC-EV-002', 'mike@vintagerestoration.com'),
  //       ('Community Garden Services', 'Green Thumb Collective', 'Garden design, maintenance, and urban farming consultation', 'https://greenthumbcollective.org', '(512) 555-0203', 'info@greenthumbcollective.org', ARRAY['home', 'specialized']::service_category[], 2, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500', true, '2025-10-15', 'SVC-EV-003', 'coordinator@greenthumbcollective.org'),

  //       --South Lamar services (neighborhood_id = 3)
  //         ('Music Lesson Studio', 'Austin Music Academy', 'Guitar, piano, and vocal lessons for all ages and skill levels', 'https://austinmusicacademy.com', '(512) 555-0301', 'lessons@austinmusicacademy.com', ARRAY['kids', 'specialized']::service_category[], 3, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500', true, '2025-12-31', 'SVC-SL-001', 'director@austinmusicacademy.com'),
  //         ('Home Renovation', 'South Austin Builders', 'Kitchen, bathroom, and whole home renovation specialists', 'https://southaustinbuilders.com', '(512) 555-0302', 'contact@southaustinbuilders.com', ARRAY['home']::service_category[], 3, 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=500', true, '2025-12-31', 'SVC-SL-002', 'office@southaustinbuilders.com'),
  //         ('Food Truck Catering', 'Lamar Street Eats', 'Mobile food service for events, parties, and corporate functions', 'https://lamarstreeteats.com', '(512) 555-0303', 'catering@lamarstreeteats.com', ARRAY['specialized']::service_category[], 3, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500', true, '2025-11-30', 'SVC-SL-003', 'booking@lamarstreeteats.com'),

  //       --Beacon Hill services (neighborhood_id = 4)
  //         ('Multicultural Tutoring', 'Learning Bridge Seattle', 'Language and academic tutoring services for diverse communities', 'https://learningbridgeseattle.org', '(206) 555-0401', 'tutoring@learningbridgeseattle.org', ARRAY['kids']::service_category[], 4, 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500', true, '2025-12-31', 'SVC-BH-001', 'admin@learningbridgeseattle.org'),
  //         ('Mobile Device Repair', 'Hill Top Tech', 'Fast and affordable smartphone and tablet repair services', 'https://hilltoptech.com', '(206) 555-0402', 'repairs@hilltoptech.com', ARRAY['specialized']::service_category[], 4, 'https://images.unsplash.com/photo-1621768216002-5ac171876625?w=500', true, '2025-12-31', 'SVC-BH-002', 'business@hilltoptech.com'),
  //         ('Senior Care Services', 'Beacon Care Companions', 'In-home care and companionship for elderly residents', 'https://beaconcarecompanions.com', '(206) 555-0403', 'care@beaconcarecompanions.com', ARRAY['health']::service_category[], 4, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500', true, '2025-09-15', 'SVC-BH-003', 'coordinator@beaconcarecompanions.com'),

  //       --Columbia City services (neighborhood_id = 5)
  //         ('Artisan Coffee Roastery', 'Columbia Roasters', 'Small-batch coffee roasting and wholesale to local businesses', 'https://columbiaroasters.com', '(206) 555-0501', 'wholesale@columbiaroasters.com', ARRAY['specialized']::service_category[], 5, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500', true, '2025-12-31', 'SVC-CC-001', 'roastmaster@columbiaroasters.com'),
  //         ('Urban Beekeeping', 'City Hive Collective', 'Beekeeping services and honey production for urban environments', 'https://cityhivecollective.org', '(206) 555-0502', 'bees@cityhivecollective.org', ARRAY['specialized']::service_category[], 5, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=500', true, '2025-12-31', 'SVC-CC-002', 'beekeeper@cityhivecollective.org'),
  //         ('Photography Studio', 'Rainier Light Studio', 'Portrait, event, and commercial photography services', 'https://rainierlightstudio.com', '(206) 555-0503', 'bookings@rainierlightstudio.com', ARRAY['specialized']::service_category[], 5, 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=500', true, '2025-08-31', 'SVC-CC-003', 'studio@rainierlightstudio.com')
  //           `);

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