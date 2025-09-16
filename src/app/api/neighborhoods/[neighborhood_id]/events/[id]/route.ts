import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { Event } from '@/types/events';
import { parsePostgreSQLArray } from '@/lib/utils';
import { HTTPError } from '@/app/api/types/httpError';

/**
 * 
 * @param request 
 * @param param1 neighborhoodId
 * @returns All events in the neighborhood ordered by date, optionally filtered by category
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ neighborhood_id: string, id: string }> }
): Promise<NextResponse<Event | HTTPError>> {
  try {
    const { neighborhood_id, id } = await params;
    console.log({ neighborhood_id, id })
    const neighborhoodId = parseInt(neighborhood_id);
    const eventId = parseInt(id);

    if (isNaN(neighborhoodId)) {
      return NextResponse.json(
        { error: 'Invalid neighborhood ID' },
        { status: 400 }
      );
    }

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Build query to get specific event by ID and neighborhood
    const query = `
      SELECT 
        e.*,
        n.neighborhood,
        n.macro_neighborhood,
        n.city_id,
        c.city, 
        c.state 
      FROM public_events e 
      JOIN neighborhoods n ON e.neighborhood_id = n.id 
      JOIN cities c ON n.city_id = c.id
      WHERE e.neighborhood_id = $1 AND e.id = $2 AND e.verified = true
    `;

    const result = await client.query(query, [neighborhoodId, eventId]);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = result.rows[0];
    event.categories = parsePostgreSQLArray(event.categories);

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching events by neighborhood:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
