import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ neighborhood_id: string }> }
) {
  try {
    const { neighborhood_id } = await params;
    console.log({neighborhood_id})
    const client = await pool.connect();

    if (!neighborhood_id) {
      client.release();
      return NextResponse.json(
      { error: 'Neighborhood neighborhood_id is required' },
      { status: 400 }
      );
    }
    
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
      WHERE n.id = $1
    `, [neighborhood_id]);
    
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Neighborhood not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch neighborhoods' },
      { status: 500 }
    );
  }
}
