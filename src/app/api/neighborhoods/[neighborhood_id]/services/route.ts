import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { HTTPError } from '@/app/api/types/httpError';
import { Service } from '@/types/events'

export async function GET(
  request: Request,
  { params }: { params: { neighborhood_id: string } }
): Promise<NextResponse<Service[] | HTTPError>>{

  try {
    const { neighborhood_id } = await params;
    console.log({serviceId: neighborhood_id})

    const neighborhoodId = parseInt(neighborhood_id);

    if (isNaN(neighborhoodId)) {
      return NextResponse.json(
        { error: 'Invalid neighborhood ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const result = await client.query(`
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
      WHERE s.neighborhood_id = $1
      ORDER BY s.title ASC
    `, [neighborhoodId]);
    client.release();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching services by neighborhood:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { neighborhood_id: string } }
): Promise<NextResponse<Service | HTTPError>> {
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
      title,
      owner,
      description,
      website,
      contact_number,
      contact_email,
      imageurl,
      verified
    } = body;

    if (!id || !title || !owner) {
      return NextResponse.json(
        { error: 'ID, title, and owner are required' },
        { status: 400 }
      );
    }

    const serviceId = parseInt(id);
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Update the service
    const updateResult = await client.query(`
      UPDATE services 
      SET 
        title = $1,
        owner = $2,
        description = $3,
        website = $4,
        contact_number = $5,
        contact_email = $6,
        imageurl = $7,
        verified = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND neighborhood_id = $10
      RETURNING *
    `, [title, owner, description, website, contact_number, contact_email, imageurl, verified, serviceId, neighborhoodId]);

    if (updateResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Service not found in this neighborhood' },
        { status: 404 }
      );
    }

    // Get the updated service with neighborhood information
    const result = await client.query(`
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
      WHERE s.id = $1
    `, [serviceId]);

    client.release();

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}
