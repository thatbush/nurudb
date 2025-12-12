// app/api/users/credits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Create credit transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, amount, transaction_type, description, category } = body;

        // Validate required fields
        if (!user_id || !amount || !transaction_type || !description || !category) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create credit transaction
        const result = await sql`
            INSERT INTO credit_transactions (
                user_id,
                amount,
                transaction_type,
                description,
                category,
                created_at
            )
            VALUES (
                ${user_id},
                ${amount},
                ${transaction_type},
                ${description},
                ${category},
                NOW()
            )
            RETURNING id
        `;

        const transactionId = result.rows[0].id;

        return NextResponse.json({
            success: true,
            data: { id: transactionId }
        });

    } catch (error) {
        console.error('Credit transaction error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create credit transaction' },
            { status: 500 }
        );
    }
}
