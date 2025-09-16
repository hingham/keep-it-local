import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { parsePostgreSQLArray } from '@/lib/utils'
import { put } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        e.*,
        n.neighborhood,
        c.city,
        c.state, 
        n.macro_neighborhood 
      FROM events e
      JOIN neighborhoods n ON e.neighborhood_id = n.id
      JOIN cities c ON n.city_id = c.id
      WHERE e.id = $1
    `, [eventId]);

    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Parse PostgreSQL array for categories field
    const event = result.rows[0];
    if (event.categories) {
      event.categories = parsePostgreSQLArray(event.categories);
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const contentType = request.headers.get('content-type');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let eventData: any;
    let imageUrl: string | null = null;

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData();
      
      // Extract image file
      const imageFile = formData.get('image') as File | null;
      
      // Upload image to Vercel Blob if provided
      if (imageFile && imageFile.size > 0) {
        try {
          const blob = await put(`events/${Date.now()}-${imageFile.name}`, imageFile, {
            access: 'public',
            contentType: imageFile.type,
          });
          imageUrl = blob.url;
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
          );
        }
      }

      // Extract other form data
      eventData = {
        date: formData.get('date'),
        recurring: formData.get('recurring') === 'true',
        title: formData.get('title'),
        time: formData.get('time'),
        location: formData.get('location'),
        website: formData.get('website'),
        categories: formData.get('categories') ? JSON.parse(formData.get('categories') as string) : [],
        neighborhood_id: formData.get('neighborhood_id') ? parseInt(formData.get('neighborhood_id') as string) : null,
        description: formData.get('description'),
        verified: formData.get('verified') === 'true',
        delete_after: formData.get('delete_after') || null,
        internal_id: formData.get('internal_id') || null,
        internal_creator_contact: formData.get('internal_creator_contact') || null,
        imageUrl: imageUrl || formData.get('imageUrl') || null
      };
    } else {
      // Handle JSON (without file upload)
      eventData = await request.json();
    }

    // Remove null/undefined values to only update provided fields
    const updateFields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query based on provided fields
    Object.entries(eventData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && key !== 'id') {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const client = await pool.connect();
    
    // Check if event exists
    const existingEvent = await client.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (existingEvent.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update the event
    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    updateValues.push(eventId);

    await client.query(updateQuery, updateValues);
    
    // Get the updated event with joined data
    const updatedEvent = await client.query(`
      SELECT 
        e.*,
        n.neighborhood,
        c.city,
        c.state, 
        n.macro_neighborhood 
      FROM events e
      JOIN neighborhoods n ON e.neighborhood_id = n.id
      JOIN cities c ON n.city_id = c.id
      WHERE e.id = $1
    `, [eventId]);

    client.release();

    // Parse PostgreSQL array for categories field
    const event = updatedEvent.rows[0];
    if (event.categories) {
      event.categories = parsePostgreSQLArray(event.categories);
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}
