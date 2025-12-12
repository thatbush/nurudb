// app/api/reverb/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Ensure session exists with user ownership
        await ensureSessionExists(id, userId);

        // Verify session belongs to user
        const ownershipCheck = await sql`
            SELECT id FROM sessions 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        if (ownershipCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'Session not found or access denied' },
                { status: 403 }
            );
        }

        // Get session info
        const sessionResult = await sql`
            SELECT id, title, created_at, updated_at
            FROM sessions
            WHERE id = ${id}
        `;

        // Get session messages
        const messagesResult = await sql`
            SELECT role, content, timestamp
            FROM conversation_messages
            WHERE session_id = ${id}
            ORDER BY timestamp ASC
        `;

        const messages = messagesResult.rows.map((row, index) => ({
            id: Date.now() + index,
            role: row.role,
            content: row.content,
            timestamp: row.timestamp
        }));

        const session = sessionResult.rows[0];
        const title = session?.title || 'New Chat';

        return NextResponse.json({
            id,
            title,
            messages
        });

    } catch (error) {
        console.error('Session fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { title, userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Update session title only if it belongs to the user
        const result = await sql`
            UPDATE sessions
            SET title = ${title}, updated_at = NOW()
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING id
        `;

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Session not found or access denied' },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Session update error:', error);
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Delete session only if it belongs to the user
        const result = await sql`
            DELETE FROM sessions
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING id
        `;

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Session not found or access denied' },
                { status: 403 }
            );
        }

        // Clean up AI data collection log
        await sql`
            DELETE FROM ai_data_collection_log
            WHERE session_id = ${id}
        `;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Session delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}

/**
 * Helper to ensure session exists with user ownership
 */
async function ensureSessionExists(sessionId: string, userId: string) {
    try {
        const existing = await sql`
            SELECT id FROM sessions WHERE id = ${sessionId}
        `;

        if (existing.rows.length === 0) {
            await sql`
                INSERT INTO sessions (id, user_id, title, created_at, updated_at)
                VALUES (
                    ${sessionId},
                    ${userId},
                    'New Chat', 
                    NOW(), 
                    NOW()
                )
                ON CONFLICT (id) DO NOTHING
            `;
        }
    } catch (error) {
        console.error('Error ensuring session exists:', error);
    }
}