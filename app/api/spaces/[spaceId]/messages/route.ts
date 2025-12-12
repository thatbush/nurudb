// app/api/spaces/[spaceId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ spaceId: string }> }
) {
    try {
        const { spaceId } = await context.params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const before = searchParams.get('before');

        let query;
        if (before) {
            query = await sql`
                SELECT 
                    m.id,
                    m.content,
                    m.message_type,
                    m.metadata,
                    m.created_at,
                    m.reply_to,
                    u.id as sender_id,
                    u.full_name as sender_name,
                    u.username as sender_username,
                    u.avatar_url as sender_avatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.space_id = ${spaceId}
                    AND m.deleted_at IS NULL
                    AND m.created_at < ${before}
                ORDER BY m.created_at DESC
                LIMIT ${limit}
            `;
        } else {
            query = await sql`
                SELECT 
                    m.id,
                    m.content,
                    m.message_type,
                    m.metadata,
                    m.created_at,
                    m.reply_to,
                    u.id as sender_id,
                    u.full_name as sender_name,
                    u.username as sender_username,
                    u.avatar_url as sender_avatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.space_id = ${spaceId}
                    AND m.deleted_at IS NULL
                ORDER BY m.created_at DESC
                LIMIT ${limit}
            `;
        }

        return NextResponse.json({
            success: true,
            data: query.rows.reverse()
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ spaceId: string }> }
) {
    try {
        const { content, userId, messageType = 'text', metadata = null, replyTo = null } = await request.json();
        const { spaceId } = await context.params;

        const result = await sql`
            INSERT INTO messages (space_id, sender_id, content, message_type, metadata, reply_to)
            VALUES (
                ${spaceId}, 
                ${userId}, 
                ${content}, 
                ${messageType}, 
                ${metadata ? JSON.stringify(metadata) : null}, 
                ${replyTo}
            )
            RETURNING 
                id,
                content,
                message_type,
                metadata,
                created_at,
                reply_to
        `;

        return NextResponse.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send message' },
            { status: 500 }
        );
    }
}