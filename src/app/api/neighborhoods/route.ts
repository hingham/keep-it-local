import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        n.id,
        n.neighborhood,
        n.city_id,
        n.macro_neighborhood,
        n.created_at,
        n.updated_at,
        c.city,
        c.state
      FROM neighborhoods n
      JOIN cities c ON n.city_id = c.id
      ORDER BY c.state, c.city, n.neighborhood
    `);
    client.release();
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch neighborhoods' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { neighborhood, city, state, macro_neighborhood } = body;

    // Validate required fields
    if (!neighborhood || !city || !state) {
      return NextResponse.json(
        { error: 'Neighborhood, city, and state are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    // First, find or create the city
    const cityResult = await client.query(
      'SELECT id FROM cities WHERE city = $1 AND state = $2',
      [city, state]
    );
    
    let cityId;
    if (cityResult.rows.length === 0) {
      // City doesn't exist, create it
      const newCityResult = await client.query(
        'INSERT INTO cities (city, state) VALUES ($1, $2) RETURNING id',
        [city, state]
      );
      cityId = newCityResult.rows[0].id;
    } else {
      cityId = cityResult.rows[0].id;
    }

    // Now create the neighborhood with the city_id
    const result = await client.query(
      `INSERT INTO neighborhoods (neighborhood, city_id, macro_neighborhood) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [neighborhood, cityId, macro_neighborhood]
    );

    // Get the complete neighborhood data with city info
    const completeResult = await client.query(`
      SELECT 
        n.id,
        n.neighborhood,
        n.city_id,
        n.macro_neighborhood,
        n.created_at,
        n.updated_at,
        c.city,
        c.state
      FROM neighborhoods n
      JOIN cities c ON n.city_id = c.id
      WHERE n.id = $1
    `, [result.rows[0].id]);

    client.release();

    return NextResponse.json(completeResult.rows[0]);
  } catch (error) {
    console.error('Error creating neighborhood:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Neighborhood already exists in this city and state' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create neighborhood' },
      { status: 500 }
    );
  }
}