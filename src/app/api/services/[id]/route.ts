import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

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
