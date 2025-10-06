/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Runbook: Add Neighborhoods to Production Database
 * 
 * This script safely adds new neighborhoods to the production database.
 * It includes safety checks and rollback capabilities.
 * 
 * Usage:
 * 1. Set environment variables for production database
 * 2. Review the neighborhoods to be added in the NEIGHBORHOODS_TO_ADD array
 * 3. Run: npx ts-node src/runbook/add-neighborhoods.ts
 * 
 * Safety Features:
 * - Dry run mode to preview changes
 * - Duplicate detection
 * - Transaction rollback on errors
 * - Detailed logging
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');
console.log('PROD_POSTGRES_URL:', process.env.PROD_POSTGRES_URL ? 'Found' : 'Not found');

const env = process.env.NODE_ENV;

let pool;
if (env === "production") {
  // Production database connection
  pool = new Pool({
    connectionString: process.env.PROD_POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  // Create connection pool
  console.log("dev env", process.env.NODE_ENV, {env})
  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: false,
  });

}


// Neighborhoods to add - UPDATE THIS ARRAY WITH YOUR NEW NEIGHBORHOODS
const NEIGHBORHOODS_TO_ADD = [
  // Northwest Seattle
  {
    neighborhood: 'Adams',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Lawton Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Briarcliff',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Southeast Magnolia',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'North Beach - Blue Ridge',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Ballard',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Blue Ridge',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'East Ballard',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Fremont',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Green Lake',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Interbay',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Loyal Heights',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Magnolia',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'North Beach',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Olympic Manor',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Phinney Ridge',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Shilshole',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Sunset Hill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'West Woodland',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },
  {
    neighborhood: 'Whittier Heights',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northwest Seattle'
  },

  // Central Capitol Hill
  {
    neighborhood: 'Minor',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Mann',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Atlantic',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Stevens',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Harrison - Denny-Blaine',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Central Business District',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: '15th Ave E / Volunteer Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Broadmoor',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Broadway',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Capitol Hill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Central District',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Colman',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Denny Blaine',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Eastlake',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'First Hill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Garfield',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Jackson Place',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Judkins Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Leschi',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Madison Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Madison Valley',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Madrona',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Montlake',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Pike/Pine',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Portage Bay',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Squire Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },
  {
    neighborhood: 'Yesler Terrace',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Central Capitol Hill'
  },

  // West Seattle
  {
    neighborhood: 'Seaview',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Gatewood',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'North Admiral',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Fairmount Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Harbor Island',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Industrial District',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'International District',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Admiral',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Alki',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Arbor Heights',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Delridge',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Fauntleroy',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Genesee-Schmitz',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'High Point',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Highland Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Morgan Junction',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'North Delridge',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Pigeon Point',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Riverview',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Roxhill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'South Delridge',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'South Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'West Seattle',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'West Seattle Junction',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Westwood',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
  {
    neighborhood: 'Genesee',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },

  // South Seattle
  {
    neighborhood: 'Holly Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Mid-Beacon Hill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Seward Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Georgetown',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Beacon Hill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Brighton',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Chinatown International District',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Columbia City',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Dunlap',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Hillman City',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Lakewood/Sewardpark',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Little Saigon',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Mount Baker',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'New Holly',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'North Beacon Hill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Othello',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Rainier Beach',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Rainier View',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Rainier Vista',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'South Beacon Hill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },

  // Northeast Seattle
  {
    neighborhood: 'Ravenna',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Bryant',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Belvedere Terrace',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Hawthorne Hills',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Inverness',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Laurelhurst',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Magnuson Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Ravenna Bryant',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Roosevelt',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Sand Point',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'University District',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'University Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'View Ridge',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Wallingford',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Wedgwood',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },
  {
    neighborhood: 'Windermere',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Northeast Seattle'
  },

  // North Seattle
  {
    neighborhood: 'North College Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Bitter Lake',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Broadview',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Cedar Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Crown Hill',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Greenwood',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Haller Lake',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Lake City',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Licton Springs',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Little Brook',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Maple Leaf',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Matthews Beach',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Meadowbrook',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'North Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Northgate',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Olympic Hills',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Pinehurst',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },
  {
    neighborhood: 'Victory Heights',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'North Seattle'
  },

  // Queen Anne Downtown
  {
    neighborhood: 'Pike-Market',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'East Queen Anne',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'West Queen Anne',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Lower Queen Anne',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'North Queen Anne',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Pioneer Square',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'SODO',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Belltown',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Cascade',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Denny Triangle',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Downtown',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Pike Place Market',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Queen Anne',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'South Lake Union',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Uptown',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'West Edge',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  },
  {
    neighborhood: 'Westlake',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'Queen Anne Downtown'
  }
];

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to 'true' for testing
const BATCH_SIZE = 10; // Process neighborhoods in batches

/**
 * Log with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${message}`);
}

/**
 * Check if city exists, create if it doesn't
 */
async function ensureCityExists(client, city, state) {
  // Check if city exists
  const cityResult = await client.query(
    'SELECT id FROM cities WHERE city = $1 AND state = $2',
    [city, state]
  );

  if (cityResult.rows.length > 0) {
    log(`City ${city}, ${state} already exists with ID: ${cityResult.rows[0].id}`);
    return cityResult.rows[0].id;
  }

  // Create city if it doesn't exist
  if (DRY_RUN) {
    log(`[DRY RUN] Would create city: ${city}, ${state}`);
    return -1; // Return dummy ID for dry run
  }

  const insertResult = await client.query(
    'INSERT INTO cities (city, state) VALUES ($1, $2) RETURNING id',
    [city, state]
  );

  log(`Created new city: ${city}, ${state} with ID: ${insertResult.rows[0].id}`);
  return insertResult.rows[0].id;
}

/**
 * Check if neighborhood already exists
 */
async function neighborhoodExists(client, neighborhood, cityId) {
  const result = await client.query(
    'SELECT id FROM neighborhoods WHERE neighborhood = $1 AND city_id = $2',
    [neighborhood, cityId]
  );
  return result.rows.length > 0;
}

/**
 * Add a single neighborhood
 */
async function addNeighborhood(client, neighborhoodData) {
  try {
    // Ensure city exists and get city_id
    const cityId = await ensureCityExists(client, neighborhoodData.city, neighborhoodData.state);

    // Check if neighborhood already exists
    if (await neighborhoodExists(client, neighborhoodData.neighborhood, cityId)) {
      log(`Neighborhood ${neighborhoodData.neighborhood} already exists in ${neighborhoodData.city}, ${neighborhoodData.state}`, 'WARN');
      return false;
    }

    // Add neighborhood
    if (DRY_RUN) {
      log(`[DRY RUN] Would add neighborhood: ${neighborhoodData.neighborhood} to ${neighborhoodData.city}, ${neighborhoodData.state} (macro: ${neighborhoodData.macro_neighborhood || 'N/A'})`);
      return true;
    }

    const result = await client.query(
      'INSERT INTO neighborhoods (neighborhood, city_id, macro_neighborhood) VALUES ($1, $2, $3) RETURNING id',
      [neighborhoodData.neighborhood, cityId, neighborhoodData.macro_neighborhood]
    );

    log(`Successfully added neighborhood: ${neighborhoodData.neighborhood} with ID: ${result.rows[0].id}`);
    return true;
  } catch (error) {
    log(`Failed to add neighborhood ${neighborhoodData.neighborhood}: ${error}`, 'ERROR');
    throw error;
  }
}

/**
 * Validate neighborhood data
 */
function validateNeighborhood(neighborhood) {
  const errors = [];

  if (!neighborhood.neighborhood?.trim()) {
    errors.push('Neighborhood name is required');
  }
  if (!neighborhood.city?.trim()) {
    errors.push('City is required');
  }
  if (!neighborhood.state?.trim()) {
    errors.push('State is required');
  }
  if (neighborhood.state && neighborhood.state.length !== 2) {
    errors.push('State must be 2 characters (e.g., "WA", "TX")');
  }

  return errors;
}

/**
 * Process neighborhoods in batches
 */
async function processBatch(client, batch) {
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const neighborhood of batch) {
    try {
      const added = await addNeighborhood(client, neighborhood);
      if (added) {
        success++;
      } else {
        skipped++;
      }
    } catch (error) {
      failed++;
      log(`Error processing ${neighborhood.neighborhood}: ${error}`, 'ERROR');
    }
  }

  return { success, failed, skipped };
}

/**
 * Main execution function
 */
async function addNeighborhoodsToProduction() {
  const client = await pool.connect();
  
  try {
    log('='.repeat(60));
    log('NEIGHBORHOOD ADDITION RUNBOOK STARTING');
    log('='.repeat(60));
    
    if (DRY_RUN) {
      log('🔍 DRY RUN MODE - No changes will be made to the database');
    } else {
      log('⚠️  PRODUCTION MODE - Changes will be applied to the database');
    }

    // Test database connection
    log('Testing database connection...');
    const testResult = await client.query('SELECT NOW() as current_time');
    log(`Database connected successfully at: ${testResult.rows[0].current_time}`);

    // Validate all neighborhoods
    log('Validating neighborhood data...');
    let hasValidationErrors = false;
    
    for (let i = 0; i < NEIGHBORHOODS_TO_ADD.length; i++) {
      const neighborhood = NEIGHBORHOODS_TO_ADD[i];
      const errors = validateNeighborhood(neighborhood);
      
      if (errors.length > 0) {
        log(`Validation errors for neighborhood ${i + 1} (${neighborhood.neighborhood}): ${errors.join(', ')}`, 'ERROR');
        hasValidationErrors = true;
      }
    }

    if (hasValidationErrors) {
      throw new Error('Validation errors found. Please fix them before proceeding.');
    }

    log(`Validation passed. Processing ${NEIGHBORHOODS_TO_ADD.length} neighborhoods...`);

    // Process neighborhoods in batches
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    if (!DRY_RUN) {
      await client.query('BEGIN'); // Start transaction
    }

    try {
      for (let i = 0; i < NEIGHBORHOODS_TO_ADD.length; i += BATCH_SIZE) {
        const batch = NEIGHBORHOODS_TO_ADD.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(NEIGHBORHOODS_TO_ADD.length / BATCH_SIZE);
        
        log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} neighborhoods)...`);
        
        const results = await processBatch(client, batch);
        totalSuccess += results.success;
        totalFailed += results.failed;
        totalSkipped += results.skipped;

        log(`Batch ${batchNumber} complete: ${results.success} added, ${results.skipped} skipped, ${results.failed} failed`);
      }

      if (!DRY_RUN && totalFailed === 0) {
        await client.query('COMMIT'); // Commit transaction
        log('Transaction committed successfully');
      } else if (!DRY_RUN) {
        await client.query('ROLLBACK'); // Rollback on any failures
        log('Transaction rolled back due to failures', 'WARN');
      }

    } catch (error) {
      if (!DRY_RUN) {
        await client.query('ROLLBACK');
        log('Transaction rolled back due to error', 'ERROR');
      }
      throw error;
    }

    // Summary
    log('='.repeat(60));
    log('EXECUTION SUMMARY');
    log('='.repeat(60));
    log(`Total neighborhoods processed: ${NEIGHBORHOODS_TO_ADD.length}`);
    log(`Successfully added: ${totalSuccess}`);
    log(`Skipped (already exist): ${totalSkipped}`);
    log(`Failed: ${totalFailed}`);
    
    if (DRY_RUN) {
      log('🔍 This was a dry run. No changes were made to the database.');
      log('To apply changes, set DRY_RUN=false and run again.');
    } else if (totalFailed === 0) {
      log('✅ All neighborhoods processed successfully!');
    } else {
      log('❌ Some neighborhoods failed to process. Check logs above.', 'WARN');
    }

  } catch (error) {
    log(`Fatal error: ${error}`, 'ERROR');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  addNeighborhoodsToProduction()
    .then(() => {
      log('Runbook completed');
      process.exit(0);
    })
    .catch((error) => {
      log(`Runbook failed: ${error}`, 'ERROR');
      process.exit(1);
    });
}


module.exports = { addNeighborhoodsToProduction, NEIGHBORHOODS_TO_ADD };