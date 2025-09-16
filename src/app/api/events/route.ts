import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { EventCategory } from '@/types/events';
import { parsePostgreSQLArray } from '@/lib/utils'
import { put } from '@/lib/storage';

export async function GET(request: Request) {
  try {
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
        c.city,
        c.state, 
        n.macro_neighborhood 
      FROM events e
      JOIN neighborhoods n ON e.neighborhood_id = n.id
      JOIN cities c ON n.city_id = c.id
      WHERE e.verified = false
    `;
    
    const queryParams: (number | string)[] = [];
    
    // Add category filter if provided
    if (categoryFilter) {
      query += ` WHERE $1 = ANY(e.categories)`;
      queryParams.push(categoryFilter);
    }
    
    query += ` ORDER BY e.date ASC`;
    
    const result = await client.query(query, queryParams);
    
    // Parse PostgreSQL array for categories field
    result.rows.forEach((row) => {
      if (row.categories) {
        row.categories = parsePostgreSQLArray(row.categories);
      }
    });

    client.release();
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log("hit post")
  try {
    const contentType = request.headers.get('content-type');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let eventData: any;
    let imageUrl: string | null = null;
    console.log({contentType})

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
        neighborhood_id: parseInt(formData.get('neighborhood_id') as string),
        description: formData.get('description'),
        verified: formData.get('verified') === 'true',
        delete_after: formData.get('delete_after') || null,
        internal_id: formData.get('internal_id') || null,
        internal_creator_contact: formData.get('internal_creator_contact') || null,
        imageUrl: imageUrl || formData.get('imageUrl') // Use uploaded image or provided URL
      };
    } else {
      // Handle JSON (without file upload)
      eventData = await request.json();
    }

    const { date, recurring, title, time, location, website, categories, neighborhood_id, description, verified, delete_after, internal_id, internal_creator_contact } = eventData;

    // Validate required fields
    if (!date || !title || !neighborhood_id) {
      return NextResponse.json(
        { error: 'Date, title, and neighborhood are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const result = await client.query(
      `INSERT INTO events (date, recurring, title, time, location, website, categories, neighborhood_id, imageUrl, verified, description, delete_after, internal_id, internal_creator_contact) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [
        date, 
        recurring || false, 
        title, 
        time, 
        location, 
        website,
        categories, 
        neighborhood_id, 
        eventData.imageUrl, 
        verified || false, 
        description,
        delete_after,
        internal_id,
        internal_creator_contact
      ]
    );
    client.release();

    // TODO: Add nodemailer to send email here at this step

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}