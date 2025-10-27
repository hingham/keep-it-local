import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { parsePostgreSQLArray } from '@/lib/utils';
import { put } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const myParams = await params;
    const serviceId = parseInt(myParams.id);
    
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        s.*,
        n.neighborhood,
        c.city,
        c.state, 
        n.macro_neighborhood 
      FROM services s
      JOIN neighborhoods n ON s.neighborhood_id = n.id
      JOIN cities c ON n.city_id = c.id
      WHERE s.id = $1
    `, [serviceId]);

    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Parse PostgreSQL array for service_category field
    const service = result.rows[0];
    if (service.service_category) {
      service.service_category = parsePostgreSQLArray(service.service_category);
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const serviceId = parseInt((await params).id);
    
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

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
        service_category: formData.get('service_category') ? JSON.parse(formData.get('service_category') as string) : [],
        neighborhood_id: formData.get('neighborhood_id') ? parseInt(formData.get('neighborhood_id') as string) : null,
        verified: formData.get('verified') === 'true',
        delete_after: formData.get('delete_after') || null,
        internal_id: formData.get('internal_id') || null,
        internal_creator_contact: formData.get('internal_creator_contact') || null,
        imageUrl: imageUrl || formData.get('imageUrl') || null
      };
    } else {
      // Handle JSON (without file upload)
      serviceData = await request.json();
    }

    // Remove null/undefined values to only update provided fields
    const updateFields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query based on provided fields
    Object.entries(serviceData).forEach(([key, value]) => {
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
    
    // Check if service exists
    const existingService = await client.query('SELECT id FROM services WHERE id = $1', [serviceId]);
    if (existingService.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Update the service
    const updateQuery = `
      UPDATE services 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    updateValues.push(serviceId);

    await client.query(updateQuery, updateValues);
    
    // Get the updated service with joined data
    const updatedService = await client.query(`
      SELECT 
        s.*,
        n.neighborhood,
        c.city,
        c.state, 
        n.macro_neighborhood 
      FROM services s
      JOIN neighborhoods n ON s.neighborhood_id = n.id
      JOIN cities c ON n.city_id = c.id
      WHERE s.id = $1
    `, [serviceId]);

    client.release();

    // Parse PostgreSQL array for service_category field
    const service = updatedService.rows[0];
    if (service.service_category) {
      service.service_category = parsePostgreSQLArray(service.service_category);
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id: itemId } = await params
    // Get the custom header
    const internalIdentifier = request.headers.get('x-delete-auth');
    
    if (!internalIdentifier) {
      return NextResponse.json(
        { error: 'Missing authentication header' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!itemId || !internalIdentifier) {
      return NextResponse.json(
        { error: 'itemId and internalIdentifier are required in the authentication header' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // First, check if the event exists and verify the internal identifier
    const checkResult = await client.query(
      `SELECT id, title, internal_creator_contact, internal_id 
       FROM services 
       WHERE id = $1`,
      [itemId]
    );

    if (checkResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = checkResult.rows[0];
    
    // Check if the internal identifier matches either internal_creator_contact or internal_id
    const isAuthorized = event.internal_creator_contact === internalIdentifier || 
                        event.internal_id === internalIdentifier;

    if (!isAuthorized) {
      client.release();
      return NextResponse.json(
        { error: 'Unauthorized. Internal identifier does not match.' },
        { status: 403 }
      );
    }

    // Delete the event
    const deleteResult = await client.query(
      `DELETE FROM services WHERE id = $1 RETURNING id, title`,
      [itemId]
    );

    client.release();

    return NextResponse.json({
      success: true,
      message: `Service "${deleteResult.rows[0].title}" has been successfully deleted`,
      deletedId: deleteResult.rows[0].id
    });

  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service.' },
      { status: 500 }
    );
  }
}
