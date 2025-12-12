// app/api/users/check-username/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username } = body;

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        if (username.length < 3) {
            return NextResponse.json({
                success: true,
                available: false,
                error: 'Username must be at least 3 characters'
            });
        }

        const result = await sql`
            SELECT id FROM users WHERE username = ${username} LIMIT 1
        `;

        return NextResponse.json({
            success: true,
            available: result.rows.length === 0
        });

    } catch (error) {
        console.error('Username check error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check username' },
            { status: 500 }
        );
    }
}