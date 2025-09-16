import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        id,
        city,
        state
      FROM cities
      ORDER BY state, city
    `);
    client.release();
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
