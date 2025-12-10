// app/api/reverb/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
    try {
        // Test 1: Check if table exists
        const tableCheck = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'conversation_messages'
            );
        `;

        // Test 2: Count total messages
        const messageCount = await sql`
            SELECT COUNT(*) as count FROM conversation_messages;
        `;

        // Test 3: Get recent messages if any
        const recentMessages = await sql`
            SELECT * FROM conversation_messages 
            ORDER BY timestamp DESC 
            LIMIT 5;
        `;

        // Test 4: Check table schema
        const schema = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'conversation_messages'
            ORDER BY ordinal_position;
        `;

        // Test 5: Test insert (then delete)
        const testSessionId = `test_${Date.now()}`;
        try {
            await sql`
                INSERT INTO conversation_messages (session_id, role, content, timestamp)
                VALUES (${testSessionId}, 'user', 'test message', NOW())
            `;

            const insertCheck = await sql`
                SELECT * FROM conversation_messages 
                WHERE session_id = ${testSessionId}
            `;

            // Clean up test data
            await sql`
                DELETE FROM conversation_messages 
                WHERE session_id = ${testSessionId}
            `;

            return NextResponse.json({
                status: 'success',
                checks: {
                    tableExists: tableCheck.rows[0].exists,
                    totalMessages: parseInt(messageCount.rows[0].count),
                    recentMessages: recentMessages.rows,
                    schema: schema.rows,
                    testInsert: {
                        success: true,
                        inserted: insertCheck.rows.length > 0
                    }
                }
            });

        } catch (insertError) {
            return NextResponse.json({
                status: 'partial_success',
                checks: {
                    tableExists: tableCheck.rows[0].exists,
                    totalMessages: parseInt(messageCount.rows[0].count),
                    recentMessages: recentMessages.rows,
                    schema: schema.rows,
                    testInsert: {
                        success: false,
                        error: insertError instanceof Error ? insertError.message : 'Unknown error'
                    }
                }
            });
        }

    } catch (error) {
        console.error('Diagnostic error:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                hint: 'Check if DATABASE_URL is set correctly in your environment variables'
            },
            { status: 500 }
        );
    }
}

// POST endpoint to manually insert a test message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const sessionId = body.sessionId || `manual_test_${Date.now()}`;

        await sql`
            INSERT INTO conversation_messages (session_id, role, content, timestamp)
            VALUES (
                ${sessionId},
                'user',
                'Manual test message',
                NOW()
            )
        `;

        await sql`
            INSERT INTO conversation_messages (session_id, role, content, timestamp)
            VALUES (
                ${sessionId},
                'assistant',
                'Manual test response',
                NOW()
            )
        `;

        return NextResponse.json({
            success: true,
            sessionId,
            message: 'Test messages inserted'
        });

    } catch (error) {
        console.error('Manual insert error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}