import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { EventCategory } from '@/types/events';
import { parsePostgreSQLArray } from '@/lib/utils'
import { put } from '@/lib/storage';
import { sendMail, isDevelopmentMode } from '@/lib/api-helpers';
import { getEmailHtmlForItemCreation } from '@/lib/emailHtml';
import { v4 as uuidv4 } from 'uuid';
/**
 * Allow fetching unverified items for review
 * @param request 
 * @returns 
 */
export async function GET(request: Request) {
  try {
    // Parse query string parameters
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');
    const verifiedFilter = searchParams.get('verified')

    // Validate category filter if provided
    if (categoryFilter && !Object.values(EventCategory).includes(categoryFilter as EventCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${Object.values(EventCategory).join(', ')}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Build query with optional filters
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
    `;

    const queryParams: (number | string | boolean)[] = [];
    const conditions: string[] = [];

    // Add category filter if provided
    if (categoryFilter) {
      queryParams.push(categoryFilter);
      conditions.push(`$${queryParams.length} = ANY(e.categories)`);
    }

    // Add verified filter if provided
    if (verifiedFilter !== null) {
      const isVerified = verifiedFilter === 'true';
      queryParams.push(isVerified);
      conditions.push(`e.verified = $${queryParams.length}`);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY e.date ASC`;

    const result = await client.query(query, queryParams);
    console.log({ result })

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
    
    if (contentType?.includes('multipart/form-data')) {
      console.log({ contentType })
      console.log({request})
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
        internal_creator_contact: formData.get('internal_creator_contact') || null,
        imageUrl: imageUrl || formData.get('imageUrl') // Use uploaded image or provided URL
      };
    } else {
      // Handle JSON (without file upload)
      eventData = await request.json();
    }

    const internal_id = uuidv4();

    const { date, recurring, title, time, location, website, categories, neighborhood_id, description, verified, delete_after, internal_creator_contact } = eventData;

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
    console.log("results:", result.rows[0]);

    // TODO: Update this to use helper functions - see service route
    if (internal_creator_contact) {
      const subject = "Event Submitted The Local Board";
      const sendToEmail = isDevelopmentMode() ? "receiver@example.com" : internal_creator_contact
      const emailHtml = getEmailHtmlForItemCreation("event", internal_creator_contact, title, internal_id);

      sendMail(subject, "emailHtml", emailHtml, sendToEmail);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
