import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ServiceCategory, Service } from '@/types/events';
import { parsePostgreSQLArray } from '@/lib/utils';
import { buildServiceFilters } from '@/lib/api-helpers';
import { HTTPError } from '@/app/api/types/httpError';

/**
 * GET /api/public/services
 * 
 * Returns filtered public services with support for multiple query parameters:
 * - city: Filter by city name
 * - macro_neighborhood: Filter by macro-neighborhood
 * - neighborhoods: Comma-separated list of neighborhood names
 * - categories: Comma-separated list of service categories
 * - limit: Maximum number of results (default: 100)
 * - offset: Number of results to skip for pagination (default: 0)
 * 
 * @param request 
 * @returns Filtered list of public services
 */
export async function GET(request: Request): Promise<NextResponse<Service[] | HTTPError>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const city = searchParams.get('city');
    const macroNeighborhood = searchParams.get('macro_neighborhood');
    const neighborhoodsParam = searchParams.get('neighborhoods');
    const categoriesParam = searchParams.get('categories');
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
      const validCategories = Object.values(ServiceCategory);
      const invalidCategories = categories.filter(cat => !validCategories.includes(cat as ServiceCategory));
      if (invalidCategories.length > 0) {
        return NextResponse.json(
          { error: `Invalid categories: ${invalidCategories.join(', ')}. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const client = await pool.connect();

    // Base query
    let query = `
      SELECT 
        s.*,
        n.neighborhood,
        n.city_id,
        n.macro_neighborhood,
        c.city,
        c.state
      FROM public_services s 
      JOIN neighborhoods n ON s.neighborhood_id = n.id 
      JOIN cities c ON n.city_id = c.id
    `;

    // Build filters using the helper function
    const { whereClause, queryParams } = buildServiceFilters({
      city,
      macroNeighborhood,
      neighborhoods,
      categories
    });

    // Add WHERE clause if filters exist
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    // Add ordering and pagination
    query += ` ORDER BY s.title ASC, s.created_at DESC`;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit.toString(), offset.toString());

    console.log('Public services query:', query);
    console.log('Query params:', queryParams);

    const result = await client.query(query, queryParams);
    client.release();

    // Parse PostgreSQL arrays
    result.rows.forEach((row) => {
      if (row.service_category) {
        row.service_category = parsePostgreSQLArray(row.service_category);
      }
    });

    // Add metadata to response headers
    const response = NextResponse.json(result.rows);
    response.headers.set('X-Total-Count', result.rows.length.toString());
    response.headers.set('X-Limit', limit.toString());
    response.headers.set('X-Offset', offset.toString());

    return response;

  } catch (error) {
    console.error('Error fetching public services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public services' },
      { status: 500 }
    );
  }
}