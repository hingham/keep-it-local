import { NextResponse } from 'next/server';
import { initializeDatabase, testConnection } from '@/lib/db';

export async function POST() {
    try {
        // Test connection first
        const connectionTest = await testConnection();
        if (!connectionTest.success) {
            return NextResponse.json(
                { error: 'Database connection failed', details: connectionTest.error },
                { status: 500 }
            );
        }

        // Initialize database schema
        const result = await initializeDatabase();

        if (result.success) {
            return NextResponse.json({
                message: 'Database schema initialized successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to initialize database', details: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Setup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {

    try {
        const connectionTest = await testConnection();
        return NextResponse.json({
            connected: connectionTest.success,
            timestamp: connectionTest.time || new Date().toISOString(),
            message: connectionTest.success ? 'Database connection successful' : 'Database connection failed'
        });
    } catch {
        return NextResponse.json(
            { error: 'Failed to test connection' },
            { status: 500 }
        );
    }
}
