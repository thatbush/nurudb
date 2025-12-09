// app/api/reverb/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get session messages
        const result = await sql`
            SELECT role, content, timestamp
            FROM conversation_messages
            WHERE session_id = ${id}
            ORDER BY timestamp ASC
        `;

        const messages = result.rows.map(row => ({
            id: Date.now() + Math.random(), // Generate unique ID for frontend
            role: row.role,
            content: row.content,
            timestamp: row.timestamp
        }));

        // Get title from first user message
        const title = messages.length > 0 && messages[0].role === 'user'
            ? messages[0].content.substring(0, 50) + (messages[0].content.length > 50 ? '...' : '')
            : 'New Chat';

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
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { title } = await request.json();

        // Update session title (stored in first message)
        // This is a simplified approach - you might want a separate sessions table

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
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Delete all messages in session
        await sql`
            DELETE FROM conversation_messages
            WHERE session_id = ${id}
        `;

        // Delete from AI data collection log
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