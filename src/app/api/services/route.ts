import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { put } from '@/lib/storage';
import { isDevelopmentMode, sendMail } from '@/lib/api-helpers';
import { getEmailHtmlForItemCreation } from "@/lib/emailHtml"
import { v4 as uuidv4 } from 'uuid';
import { parsePostgreSQLArray } from '@/lib/utils';

export async function GET() {
  try {
    const client = await pool.connect();
    const query = `
      SELECT 
        s.*,
        n.neighborhood,
        c.city,
        c.state, 
        n.macro_neighborhood 
      FROM services s
      JOIN neighborhoods n ON s.neighborhood_id = n.id
      JOIN cities c ON n.city_id = c.id
      WHERE s.verified = true
    `;

    const result = await client.query(query);

    client.release();

    // Parse PostgreSQL array for categories field
    result.rows.forEach((row) => {
      if (row.categories) {
        row.categories = parsePostgreSQLArray(row.categories);
      }
    });
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let serviceData: any;
    let imageUrl: string | null = null;

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData();

      // Extract image file
      const imageFile = formData.get('image') as File | null;

      // Upload image to Vercel Blob if provided
      if (imageFile && imageFile.size > 0) {
        try {
          const blob = await put(`services/${Date.now()}-${imageFile.name}`, imageFile, {
            access: 'public',
            contentType: imageFile.type,
          });
          imageUrl = blob.url;
          console.log({imageUrl, blob})
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
          );
        }
      }

      // Extract other form data
      serviceData = {
        title: formData.get('title'),
        owner: formData.get('owner'),
        description: formData.get('description'),
        website: formData.get('website'),
        contact_number: formData.get('contact_number'),
        contact_email: formData.get('contact_email'),
        neighborhood_id: parseInt(formData.get('neighborhood_id') as string),
        verified: formData.get('verified') === 'true',
        delete_after: formData.get('delete_after') || null,
        internal_creator_contact: formData.get('internal_creator_contact') || null,
        service_category: formData.get('service_category') ? JSON.parse(formData.get('service_category') as string) : [],
        imageUrl: imageUrl || formData.get('imageUrl') // Use uploaded image or provided URL
      };
    } else {
      // Handle JSON (without file upload)
      serviceData = await request.json();
    }

    const { title, owner, description, website, contact_number, contact_email, neighborhood_id, verified, delete_after, internal_creator_contact, service_category } = serviceData;

    const internal_id = uuidv4();

    // Validate required fields
    if (!title || !owner || !neighborhood_id) {
      return NextResponse.json(
        { error: 'Title, owner, and neighborhood are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const result = await client.query(
      `INSERT INTO services (title, owner, description, website, contact_number, contact_email, categories, neighborhood_id, imageUrl, verified, delete_after, internal_id, internal_creator_contact) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [title, owner, description, website, contact_number, contact_email, service_category, neighborhood_id, serviceData.imageUrl, verified || false, delete_after, internal_id, internal_creator_contact]
    );
    client.release();
    // TODO: Add nodemailer to send email here at this step
    if (internal_creator_contact) {
      // TODO: Update this to use helper functions - see service route
      if (internal_creator_contact) {
        const subject = "Service Submitted to The Local Board";
        const sendToEmail = isDevelopmentMode() ? "receiver@example.com" : internal_creator_contact
        const emailHtml = getEmailHtmlForItemCreation("service", internal_creator_contact, title, internal_id);

        await sendMail(subject, "emailHtml", emailHtml, sendToEmail);
      }

    }


    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
