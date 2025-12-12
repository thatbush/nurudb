// ===================================
// app/api/spaces/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// app/api/spaces/route.ts - UPDATE the GET method
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        let query;
        if (userId) {
            // Check membership for the user
            query = await sql`
                SELECT 
                    s.id,
                    s.name,
                    s.display_name,
                    s.description,
                    s.is_public,
                    s.creator_id,
                    s.created_at,
                    s.updated_at,
                    s.members_count,
                    s.logo_url,
                    s.verified,
                    CASE WHEN sm.user_id IS NOT NULL THEN true ELSE false END as is_member
                FROM spaces s
                LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = ${userId}
                WHERE s.is_public = true
                ORDER BY s.members_count DESC NULLS LAST, s.created_at DESC
                LIMIT 20
            `;
        } else {
            query = await sql`
                SELECT 
                    id,
                    name,
                    display_name,
                    description,
                    is_public,
                    creator_id,
                    created_at,
                    updated_at,
                    members_count,
                    logo_url,
                    verified,
                    false as is_member
                FROM spaces
                WHERE is_public = true
                ORDER BY members_count DESC NULLS LAST, created_at DESC
                LIMIT 20
            `;
        }

        return NextResponse.json({
            success: true,
            data: query.rows
        });
    } catch (error) {
        console.error('Spaces fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch spaces' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, display_name, description, is_public, creator_id } = body;

        // Validate required fields
        if (!name || !display_name || !creator_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if space name already exists
        const existingSpace = await sql`
            SELECT id FROM spaces WHERE name = ${name}
        `;

        if (existingSpace.rows.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Space name already exists' },
                { status: 409 }
            );
        }

        // Create the space
        const result = await sql`
            INSERT INTO spaces (
                name,
                display_name,
                description,
                is_public,
                creator_id,
                members_count,
                verified
            )
            VALUES (
                ${name},
                ${display_name},
                ${description || null},
                ${is_public},
                ${creator_id},
                1,
                false
            )
            RETURNING 
                id,
                name,
                display_name,
                description,
                is_public,
                creator_id,
                created_at,
                updated_at,
                members_count,
                logo_url,
                verified
        `;

        return NextResponse.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Space creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create space' },
            { status: 500 }
        );
    }
}