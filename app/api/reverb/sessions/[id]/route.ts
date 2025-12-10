// app/api/reverb/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Ensure session exists first
        await ensureSessionExists(id);

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
            id: Date.now() + index, // Generate unique ID for frontend
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
        const { title } = await request.json();

        // Update session title in sessions table
        await sql`
            UPDATE sessions
            SET title = ${title}, updated_at = NOW()
            WHERE id = ${id}
        `;

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

        // Delete session (CASCADE will delete messages automatically)
        await sql`
            DELETE FROM sessions
            WHERE id = ${id}
        `;

        // Also clean up AI data collection log
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
 * Helper to ensure session exists
 */
async function ensureSessionExists(sessionId: string) {
    try {
        const existing = await sql`
            SELECT id FROM sessions WHERE id = ${sessionId}
        `;

        if (existing.rows.length === 0) {
            await sql`
                INSERT INTO sessions (id, title, created_at, updated_at)
                VALUES (
                    ${sessionId}, 
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