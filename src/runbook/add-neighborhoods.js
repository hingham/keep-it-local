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
// Production database connection
const pool = new Pool({
  connectionString: process.env.PROD_POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Neighborhoods to add - UPDATE THIS ARRAY WITH YOUR NEW NEIGHBORHOODS
const NEIGHBORHOODS_TO_ADD = [
  // South Seattle neighborhoods
  {
    neighborhood: 'Beacon Hill',
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
    neighborhood: 'Mount Baker',
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
    neighborhood: 'South Beacon Hill',
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
    neighborhood: 'Rainier Beach',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'SODO',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'South Seattle'
  },
  {
    neighborhood: 'Leschi',
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
  // West Seattle neighborhoods
  {
    neighborhood: 'Alki',
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
    neighborhood: 'Genesee',
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
    neighborhood: 'Fairmount Park',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
  },
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
    neighborhood: 'High Point',
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
    neighborhood: 'Fauntleroy',
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
    neighborhood: 'Highland Park',
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
    neighborhood: 'Arbor Heights',
    city: 'Seattle',
    state: 'WA',
    macro_neighborhood: 'West Seattle'
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