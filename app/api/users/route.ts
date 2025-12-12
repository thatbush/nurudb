// ===================================
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Create user profile
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { auth_id, email, username, credits } = body;

        // Validate required fields
        if (!auth_id || !email || !username) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create user profile
        const userResult = await sql`
            INSERT INTO users (
                auth_id,
                email,
                username,
                credits,
                is_verified,
                created_at,
                updated_at
            )
            VALUES (
                ${auth_id},
                ${email},
                ${username},
                ${credits},
                false,
                NOW(),
                NOW()
            )
            RETURNING id
        `;

        const userId = userResult.rows[0].id;

        // Create welcome bonus transaction
        await sql`
            INSERT INTO credit_transactions (
                user_id,
                amount,
                transaction_type,
                description,
                category,
                created_at
            )
            VALUES (
                ${userId},
                ${credits},
                'welcome_bonus',
                'Welcome bonus for signing up!',
                'earned',
                NOW()
            )
        `;

        return NextResponse.json({
            success: true,
            data: { id: userId }
        });

    } catch (error) {
        console.error('User creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create user' },
            { status: 500 }
        );
    }
}

// Update user profile
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { auth_id, email, username, credits } = body;

        // Validate required fields
        if (!auth_id || !email || !username) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Update user profile
        const userResult = await sql`
            UPDATE users
            SET email = ${email},
                username = ${username},
                credits = ${credits},
                updated_at = NOW()
            WHERE auth_id = ${auth_id}
            RETURNING id
        `;

        const userId = userResult.rows[0].id;

        return NextResponse.json({
            success: true,
            data: { id: userId }
        });

    } catch (error) {
        console.error('User update error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// Delete user profile
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { auth_id } = body;

        // Validate required fields
        if (!auth_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Delete user profile
        const userResult = await sql`
            DELETE FROM users
            WHERE auth_id = ${auth_id}
            RETURNING id
        `;

        const userId = userResult.rows[0].id;

        return NextResponse.json({
            success: true,
            data: { id: userId }
        });

    } catch (error) {
        console.error('User delete error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}

// Get user profile
export async function GET(request: NextRequest) {
    try {
        const body = await request.json();
        const { auth_id } = body;

        // Validate required fields
        if (!auth_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get user profile
        const userResult = await sql`
            SELECT * FROM users
            WHERE auth_id = ${auth_id}
        `;

        const userId = userResult.rows[0].id;

        return NextResponse.json({
            success: true,
            data: { id: userId }
        });

    } catch (error) {
        console.error('User get error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get user' },
            { status: 500 }
        );
    }
}
