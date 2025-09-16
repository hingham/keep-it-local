import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { EventCategory, Event } from '@/types/events';
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
  { params }: { params: { neighborhood_id: string } }
): Promise<NextResponse<Event[] | HTTPError>> {
  try {
    const { neighborhood_id } = await params;

    const neighborhoodId = parseInt(neighborhood_id);

    if (isNaN(neighborhoodId)) {
      return NextResponse.json(
        { error: 'Invalid neighborhood ID' },
        { status: 400 }
      );
    }

    // Parse query string parameters
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');

    // Validate category filter if provided
    if (categoryFilter && !Object.values(EventCategory).includes(categoryFilter as EventCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${Object.values(EventCategory).join(', ')}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Build query with optional category filter
    let query = `
      SELECT 
        e.*,
        n.neighborhood,
        n.city_id,
        n.macro_neighborhood,
        c.city,
        c.state
      FROM public_events e 
      JOIN neighborhoods n ON e.neighborhood_id = n.id 
      JOIN cities c ON n.city_id = c.id
      WHERE e.neighborhood_id = $1
    `;

    const queryParams: (number | string)[] = [neighborhoodId];

    // Add category filter if provided
    if (categoryFilter) {
      query += ` AND $2 = ANY(e.categories)`;
      queryParams.push(categoryFilter);
    }

    query += ` ORDER BY e.date ASC`;

    const result = await client.query(query, queryParams);
    client.release();

    result.rows.forEach((row) => {
      row.categories = parsePostgreSQLArray(row.categories)
    })

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching events by neighborhood:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { neighborhood_id: string } }
): Promise<NextResponse<Event | HTTPError>> {
  try {
    const { neighborhood_id } = params;
    const neighborhoodId = parseInt(neighborhood_id);

    if (isNaN(neighborhoodId)) {
      return NextResponse.json(
        { error: 'Invalid neighborhood ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
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
      imageurl,
      verified
    } = body;

    if (!id || !date || !title) {
      return NextResponse.json(
        { error: 'ID, date, and title are required' },
        { status: 400 }
      );
    }

    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Validate categories if provided
    if (categories && Array.isArray(categories)) {
      const validCategories = Object.values(EventCategory);
      const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
      if (invalidCategories.length > 0) {
        return NextResponse.json(
          { error: `Invalid categories: ${invalidCategories.join(', ')}. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const client = await pool.connect();

    // Update the event
    const updateResult = await client.query(`
      UPDATE events 
      SET 
        date = $1,
        recurring = $2,
        date_list = $3,
        title = $4,
        time = $5,
        location = $6,
        description = $7,
        website = $8,
        categories = $9,
        imageurl = $10,
        verified = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 AND neighborhood_id = $13
      RETURNING *
    `, [date, recurring, date_list, title, time, location, description, website, categories, imageurl, verified, eventId, neighborhoodId]);

    if (updateResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Event not found in this neighborhood' },
        { status: 404 }
      );
    }

    // Get the updated event with neighborhood information
    const result = await client.query(`
      SELECT 
        e.*,
        n.neighborhood,
        n.city_id,
        n.macro_neighborhood,
        c.city,
        c.state
      FROM public_events e 
      JOIN neighborhoods n ON e.neighborhood_id = n.id 
      JOIN cities c ON n.city_id = c.id
      WHERE e.id = $1
    `, [eventId]);

    client.release();

    const event = result.rows[0];
    event.categories = parsePostgreSQLArray(event.categories);

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}
