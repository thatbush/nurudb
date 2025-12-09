// app/api/reverb/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
    try {
        // Get all sessions with their message counts and latest messages
        const result = await sql`
            SELECT 
                cm.session_id as id,
                COALESCE(
                    SUBSTRING(MIN(CASE WHEN cm.role = 'user' THEN cm.content END), 1, 100),
                    'New Chat'
                ) as title,
                MAX(cm.content) FILTER (WHERE cm.role = 'assistant') as last_message,
                MAX(cm.timestamp) as timestamp,
                COUNT(*) as message_count
            FROM conversation_messages cm
            GROUP BY cm.session_id
            ORDER BY MAX(cm.timestamp) DESC
            LIMIT 50
        `;

        const sessions = result.rows.map(row => ({
            id: row.id,
            title: row.title || 'New Chat',
            lastMessage: row.last_message || 'No messages yet',
            timestamp: row.timestamp,
            messageCount: parseInt(row.message_count) || 0
        }));

        return NextResponse.json({ sessions });

    } catch (error) {
        console.error('Sessions fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}