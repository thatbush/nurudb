// app/api/messages/dm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const recipientId = searchParams.get('recipientId');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!userId || !recipientId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId or recipientId' },
                { status: 400 }
            );
        }

        const result = await sql`
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
            WHERE m.deleted_at IS NULL
                AND (
                    (m.sender_id = ${userId} AND m.recipient_id = ${recipientId})
                    OR
                    (m.sender_id = ${recipientId} AND m.recipient_id = ${userId})
                )
            ORDER BY m.created_at DESC
            LIMIT ${limit}
        `;

        return NextResponse.json({
            success: true,
            data: result.rows.reverse()
        });
    } catch (error) {
        console.error('Error fetching DM messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { recipientId, senderId, content, messageType = 'text', metadata = null } = await request.json();

        // Ensure conversation exists
        const [user1Id, user2Id] = [senderId, recipientId].sort();

        await sql`
            INSERT INTO dm_conversations (user1_id, user2_id, last_message_at)
            VALUES (${user1Id}, ${user2Id}, NOW())
            ON CONFLICT (user1_id, user2_id) 
            DO UPDATE SET last_message_at = NOW()
        `;

        // Insert message
        const result = await sql`
            INSERT INTO messages (sender_id, recipient_id, content, message_type, metadata)
            VALUES (
                ${senderId}, 
                ${recipientId}, 
                ${content}, 
                ${messageType}, 
                ${metadata ? JSON.stringify(metadata) : null}
            )
            RETURNING 
                id,
                content,
                message_type,
                metadata,
                created_at
        `;

        return NextResponse.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error sending DM:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send message' },
            { status: 500 }
        );
    }
}