import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { Service } from '@/types/events';
import { HTTPError } from '@/app/api/types/httpError';
/**
 * Response Example:
 {
  "id": 1,
  "title": "Local Bike Repair",
  "owner": "Mike's Cycles",
  "description": "Professional bike repair service",
  "website": "https://mikescycles.com",
  "contact_number": "(512) 555-0123",
  "contact_email": "mike@mikescycles.com",
  "neighborhood_id": 1,
  "verified": true,
  "neighborhood": "Downtown",
  "city": "Austin", 
  "state": "TX",
  "macro_neighborhood": "Central Austin"
}
 */

/**
 * 
 * @param request 
 * @param params Contains neighborhood_id and id
 * @returns Single service by ID within the specified neighborhood
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ neighborhood_id: string, id: string }> }
): Promise<NextResponse<Service | HTTPError>> {
  try {
    const { neighborhood_id, id } = await params;
    console.log({neighborhood_id, id})
    const neighborhoodId = parseInt(neighborhood_id);
    const serviceId = parseInt(id);

    if (isNaN(neighborhoodId)) {
      return NextResponse.json(
        { error: 'Invalid neighborhood ID' },
        { status: 400 }
      );
    }

    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Build query to get specific service by ID and neighborhood
    const query = `
      SELECT 
        s.*,
        n.neighborhood,
        n.macro_neighborhood, 
        n.city_id,
        c.city, 
        c.state 
      FROM public_services s 
      JOIN neighborhoods n ON s.neighborhood_id = n.id 
      JOIN cities c ON n.city_id = c.id
      WHERE s.neighborhood_id = $1 AND s.id = $2
    `;

    const result = await client.query(query, [neighborhoodId, serviceId]);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const service = result.rows[0];

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service by neighborhood and ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}