import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { EventCategory, Event } from '@/types/events';
import { parsePostgreSQLArray } from '@/lib/utils';
import { buildEventFilters } from '@/lib/api-helpers';
import { HTTPError } from '@/app/api/types/httpError';

/**
 * GET /api/public/events
 * 
 * Returns filtered public events with support for multiple query parameters:
 * - city: Filter by city name
 * - macro_neighborhood: Filter by macro-neighborhood
 * - neighborhoods: Comma-separated list of neighborhood names
 * - categories: Comma-separated list of event categories
 * - date_from: Filter events from this date (YYYY-MM-DD)
 * - date_to: Filter events until this date (YYYY-MM-DD)
 * - limit: Maximum number of results (default: 100)
 * - offset: Number of results to skip for pagination (default: 0)
 * 
 * @param request 
 * @returns Filtered list of public events
 */
export async function GET(request: Request): Promise<NextResponse<Event[] | HTTPError>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const city = searchParams.get('city');
    const macroNeighborhood = searchParams.get('macro_neighborhood');
    const neighborhoodsParam = searchParams.get('neighborhoods');
    const categoriesParam = searchParams.get('categories');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Parse array parameters
    const neighborhoods = neighborhoodsParam ? neighborhoodsParam.split(',').map(n => n.trim()) : null;
    const categories = categoriesParam ? categoriesParam.split(',').map(c => c.trim()) : null;

    // Parse pagination parameters
    const limit = limitParam ? parseInt(limitParam) : 100;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    // Validate limit and offset
    if (isNaN(limit) || limit <= 0 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 1000' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be a non-negative number' },
        { status: 400 }
      );
    }

    // Validate categories if provided
    if (categories) {
      const validCategories = Object.values(EventCategory);
      const invalidCategories = categories.filter(cat => !validCategories.includes(cat as EventCategory));
      if (invalidCategories.length > 0) {
        return NextResponse.json(
          { error: `Invalid categories: ${invalidCategories.join(', ')}. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate date format if provided
    if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      return NextResponse.json(
        { error: 'date_from must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      return NextResponse.json(
        { error: 'date_to must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Base query
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
    `;

    // Build filters using the helper function
    const { whereClause, queryParams } = buildEventFilters({
      city,
      macroNeighborhood,
      neighborhoods,
      categories,
      dateFrom,
      dateTo
    });

    // Add WHERE clause if filters exist
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    // Add ordering and pagination
    query += ` ORDER BY e.date ASC, e.created_at DESC`;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit.toString(), offset.toString());

    console.log('Public events query:', query);
    console.log('Query params:', queryParams);

    const result = await client.query(query, queryParams);
    client.release();

    // Parse PostgreSQL arrays
    result.rows.forEach((row) => {
      if (row.categories) {
        row.categories = parsePostgreSQLArray(row.categories);
      }
    });

    // Add metadata to response headers
    const response = NextResponse.json(result.rows);
    response.headers.set('X-Total-Count', result.rows.length.toString());
    response.headers.set('X-Limit', limit.toString());
    response.headers.set('X-Offset', offset.toString());

    return response;

  } catch (error) {
    console.error('Error fetching public events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public events' },
      { status: 500 }
    );
  }
}
