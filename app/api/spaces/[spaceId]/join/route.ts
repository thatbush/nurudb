// app/api/spaces/[spaceId]/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ spaceId: string }> }
) {
    try {
        const { userId } = await request.json();
        const { spaceId } = await context.params;

        if (!spaceId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing spaceId or userId' },
                { status: 400 }
            );
        }

        // Check if already a member
        const existing = await sql`
            SELECT id FROM space_members 
            WHERE space_id = ${spaceId} AND user_id = ${userId}
        `;

        if (existing.rows.length > 0) {
            return NextResponse.json({
                success: true,
                message: 'Already a member'
            });
        }

        // Add member
        await sql`
            INSERT INTO space_members (space_id, user_id)
            VALUES (${spaceId}, ${userId})
        `;

        // Update member count
        await sql`
            UPDATE spaces 
            SET members_count = COALESCE(members_count, 0) + 1 
            WHERE id = ${spaceId}
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error joining space:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to join space' },
            { status: 500 }
        );
    }
}
