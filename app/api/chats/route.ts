// app/api/chats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        // Get user's spaces with last message
        const spaces = await sql`
            SELECT 
                s.id,
                s.name,
                s.display_name as "displayName",
                s.logo_url as avatar,
                'space' as type,
                COALESCE(s.members_count, 0) as members_count,
                (
                    SELECT m.content 
                    FROM messages m 
                    WHERE m.space_id = s.id AND m.deleted_at IS NULL
                    ORDER BY m.created_at DESC 
                    LIMIT 1
                ) as "lastMessage",
                (
                    SELECT m.created_at 
                    FROM messages m 
                    WHERE m.space_id = s.id AND m.deleted_at IS NULL
                    ORDER BY m.created_at DESC 
                    LIMIT 1
                ) as "lastMessageTime",
                (
                    SELECT COUNT(*) 
                    FROM messages m 
                    WHERE m.space_id = s.id 
                        AND m.deleted_at IS NULL
                        AND m.created_at > COALESCE(sm.last_read_at, '1970-01-01')
                ) as "unreadCount"
            FROM spaces s
            JOIN space_members sm ON s.id = sm.space_id
            WHERE sm.user_id = ${userId}
            ORDER BY "lastMessageTime" DESC NULLS LAST
        `;

        // Get user's DM conversations with last message
        const dms = await sql`
            SELECT 
                CASE 
                    WHEN dc.user1_id = ${userId} THEN dc.user2_id 
                    ELSE dc.user1_id 
                END as id,
                CASE 
                    WHEN dc.user1_id = ${userId} THEN u2.username 
                    ELSE u1.username 
                END as name,
                CASE 
                    WHEN dc.user1_id = ${userId} THEN u2.full_name 
                    ELSE u1.full_name 
                END as "displayName",
                CASE 
                    WHEN dc.user1_id = ${userId} THEN u2.avatar_url 
                    ELSE u1.avatar_url 
                END as avatar,
                'dm' as type,
                (
                    SELECT m.content 
                    FROM messages m 
                    WHERE m.deleted_at IS NULL
                        AND (
                            (m.sender_id = ${userId} AND m.recipient_id = (
                                CASE WHEN dc.user1_id = ${userId} THEN dc.user2_id ELSE dc.user1_id END
                            ))
                            OR
                            (m.recipient_id = ${userId} AND m.sender_id = (
                                CASE WHEN dc.user1_id = ${userId} THEN dc.user2_id ELSE dc.user1_id END
                            ))
                        )
                    ORDER BY m.created_at DESC 
                    LIMIT 1
                ) as "lastMessage",
                dc.last_message_at as "lastMessageTime",
                0 as "unreadCount"
            FROM dm_conversations dc
            JOIN users u1 ON dc.user1_id = u1.id
            JOIN users u2 ON dc.user2_id = u2.id
            WHERE dc.user1_id = ${userId} OR dc.user2_id = ${userId}
            ORDER BY dc.last_message_at DESC
        `;

        const allChats = [...spaces.rows, ...dms.rows].sort((a, b) => {
            const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return bTime - aTime;
        });

        return NextResponse.json({
            success: true,
            data: allChats
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch chats' },
            { status: 500 }
        );
    }
}