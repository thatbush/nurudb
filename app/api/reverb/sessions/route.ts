// app/api/reverb/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
    try {
        // Get all sessions with their message counts and latest messages
        const result = await sql`
            SELECT 
                s.id,
                s.title,
                s.created_at,
                s.updated_at as timestamp,
                COUNT(cm.id) as message_count,
                MAX(cm.content) FILTER (WHERE cm.role = 'assistant') as last_message
            FROM sessions s
            LEFT JOIN conversation_messages cm ON s.id = cm.session_id
            GROUP BY s.id, s.title, s.created_at, s.updated_at
            ORDER BY s.updated_at DESC
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